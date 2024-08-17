import datetime
from typing import Any, Dict, Optional, Tuple
from flask import Blueprint, Response, request, jsonify
import threading
from .auth import db
from .gemini_api import generate_product_info, generate_mock_comments
from firebase_admin import firestore
from furl import furl
from datetime import datetime, timedelta, timezone
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor
import time
from enum import Enum


gen_bp = Blueprint("gen", __name__)

class Status(Enum):
    LOADING = 1
    COMPLETE_SUCCESS = 2
    COMPLETE_FAIL = 3

# Convert URL that may have more than one possible representation into a stripped standard form
def canonicalize_url(link: str) -> str:
    f = furl(unquote(link))
    f.args = {}
    f.fragment = ""
    return f.url


def _update_generation_counts(
    user_ref: firestore.DocumentReference, 
    product_ref: firestore.DocumentReference, 
    gen_request_ref: firestore.DocumentReference
) -> None:
    user_ref.update({
        "total_comment_generations": firestore.Increment(1),
    })

    product_ref.update({
        "total_comments": firestore.Increment(1),
        "last_updated": firestore.SERVER_TIMESTAMP
    })

    gen_request_ref.update({
        "num_comments_generated": firestore.Increment(1),
    })



def _extract_and_validate_data(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts and validates the necessary fields from the input data dictionary.

    This function checks if essential fields like "user_id" and "link" are present in the input data. It also 
    processes and normalizes the product link, assigns default values to certain fields, and compiles the 
    product data into a dictionary.

    :param data: A dictionary containing the input data from a request. It should include keys like "user_id", "link", "numRequestedComments", and "pollutionLevel".

    :return: a dictionary containing the extracted and validated data if the essential fields are present; otherwise, returns None if the required fields are missing
    """
    user_id = data.get("user_id")
    product_link = canonicalize_url(data.get("link", ""))
    num_comments_requested = data.get("numRequestedComments", 50)
    pollution_level = data.get("pollutionLevel", 0)

    product_data = generate_product_info(product_link)

    if not user_id or not product_link:
        return None

    return {
        "user_id": user_id,
        "product_link": product_link,
        "num_comments_requested": num_comments_requested,
        "pollution_level": pollution_level,
        "product_data": product_data
    }


def _get_or_create_product(
    user_id: str, 
    product_link: str, 
    num_comments_requested: int, 
    product_data: Dict[str, str]
) -> Optional[Tuple[firestore.DocumentReference, firestore.DocumentReference]]:
    """
    Retrieves an existing product reference from Firestore or creates a new one if it does not exist.

    This function searches for a product associated with the given `user_id` and `product_link` 
    in the Firestore database. If the product exists and was recently queried (within the last 
    15 seconds), it returns `None` to indicate a duplicate request. Otherwise, it updates or 
    creates the product document with the provided data and returns a reference to the product 
    document.

    :param user_id: The unique identifier of the user in the Firestore database.
    :param product_link: The canonicalized URL of the product being queried or created.
    :param num_comments_requested: The number of comments requested for the product.
    :param product_data: A dictionary containing additional product information such as 
                         "url", "product_name", "description", and "est_price".

    :return: a Firestore DocumentReference to the user and product if successful. If the user does 
             not exist or the request is considered a duplicate, it returns None.
    """
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return None

    products_ref = user_ref.collection("products")
    existing_product_query = products_ref.where("url", "==", product_link).get()

    # if this product already exists in the DB and was not queried in the last 15 seconds, return that instance
    if existing_product_query:
        product_ref = existing_product_query[0].reference  
        last_updated = existing_product_query[0].get("last_updated")

        now = datetime.now(timezone.utc)
        delta_neg = now - timedelta(seconds=15)
        delta_pos = now + timedelta(seconds=15)
        
        if last_updated and delta_neg <= last_updated <= delta_pos:
            return None

        product_ref.update({
            "total_comments": firestore.Increment(num_comments_requested),
            "total_gen_requests": firestore.Increment(1),
            "last_updated": firestore.SERVER_TIMESTAMP
        })

    else: # product does not exist yet, initialize data and generate name,desc,price
        product_ref = products_ref.document()
        product_ref.set({
            "url": product_data["url"],
            "product_name": product_data["product_name"],
            "description": product_data["description"],
            "total_comments": 0,
            "total_gen_requests": 1,
            "est_price": product_data["est_price"],
            "last_updated": firestore.SERVER_TIMESTAMP
        })

    user_ref.update({
        "total_gen_requests": firestore.Increment(1)
    })

    return user_ref, product_ref


def _create_gen_request(
    product_ref: firestore.DocumentReference, 
    num_comments_requested: int, 
    pollution_level: str = "Low",
    status: str = "LOADING", 
    metadata: Optional[Dict[str, Any]] = None
) -> firestore.DocumentReference:
    """
    Creates a new generation request document in the `gen_requests` subcollection of a product.

    This function generates a new `gen_request` document within the `gen_requests` subcollection 
    of the specified product reference. The document stores the number of comments requested, 
    the status of the request, and any additional metadata provided.

    :param product_ref: A Firestore DocumentReference pointing to the product for which the 
                        generation request is being created.
    :param num_comments_requested: The number of comments that have been requested.
    :param status: The initial status of the generation request. Defaults to "LOADING".
    :param metadata: Optional dictionary containing additional metadata for the generation request.

    :return: A Firestore DocumentReference to the newly created generation request document.
    """
    if metadata is None: metadata = {}

    gen_request_ref = product_ref.collection("gen_requests").document()

    gen_request_data = {
        "request_id": gen_request_ref.id,
        "num_comments_requested": num_comments_requested,
        "num_comments_generated": 0,
        "pollution_level": pollution_level.upper(),
        "status": status,
        "request_timestamp": firestore.SERVER_TIMESTAMP,
        "model_version": "gemini-1.5-flash", # "DevTest", # TODO: provide gemini version here
        "num_exports": 0,
        **metadata
    }

    gen_request_ref.set(gen_request_data)
    
    return gen_request_ref


# under construction
def _generate_initial_comments(
    user_ref: firestore.DocumentReference, 
    product_ref: firestore.DocumentReference, 
    gen_request_ref: firestore.DocumentReference, 
    product_data: Dict[str, str],
    pollution_level: str = "Low",
    num_request_comments: int = 50
) -> list[str]:
    """
    Generates an initial set of comments and stores them in Firestore.

    This function creates a specified number of initial comments for a product and stores 
    them in the `generated_comments` subcollection of the provided Firestore document 
    reference. Each comment is accompanied by placeholder relevancy and offensivity scores.

    :param product_ref: A Firestore DocumentReference pointing to the product for which 
                        comments are being generated.
    :param num_initial_comments: The number of comments to generate and store. Defaults to 50.

    :return: A list of generated comment strings.
    """
    generated_comments_ref = gen_request_ref.collection("generated_comments")

    num_initial_comments = min(50, num_request_comments)
    
    try:
        initial_comments = generate_mock_comments(
            product_info_dict=product_data,
            pollution_level=pollution_level,
            num_to_generate=num_initial_comments
        )

        for comment_data in initial_comments:
            _update_generation_counts(user_ref, product_ref, gen_request_ref)
            generated_comments_ref.add({
                "comment": comment_data["comment"],
                "relevancy_score": float(comment_data["relevancy_score"]),  
                "offensivity_score": float(comment_data["offensivity_score"]), 
                "timestamp": firestore.SERVER_TIMESTAMP
            })

    except Exception as e:
        print("\t\tMAJOR ERROR @_generate_initial_comments", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500   

    return initial_comments

# under construction
def _generate_remaining_comments(
    user_ref: firestore.DocumentReference, 
    product_ref: firestore.DocumentReference, 
    gen_request_ref: firestore.DocumentReference, 
    total_comments: int, 
    num_initial_comments: int
) -> None:
    """
    Generates and stores the remaining comments in Firestore after the initial batch.

    This function generates the remaining comments beyond the initial set and stores them 
    in the `generated_comments` subcollection of the provided Firestore document reference. 
    Each comment is accompanied by placeholder relevancy and offensivity scores. The function 
    pauses briefly between storing each comment to simulate a more realistic generation process.

    :param product_ref: A Firestore DocumentReference pointing to the product for which 
                        comments are being generated.
    :param total_comments: The total number of comments that were requested for the product.
    :param num_initial_comments: The number of comments that were initially generated.

    :return: None. This function performs its operations and does not return a value.
    """
    remaining_comments = total_comments - num_initial_comments
    comments = [f"Multithread ahh Comment numba {i + num_initial_comments + 1}" for i in range(remaining_comments)]
    
    generated_comments_ref = gen_request_ref.collection("generated_comments")
    for comment in comments:
        _update_generation_counts(user_ref, product_ref, gen_request_ref)
        generated_comments_ref.add({
            "comment": comment,
            "relevancy_score": 0.5,  # Placeholder 
            "offensivity_score": 0.1,  # Placeholder
            "timestamp": firestore.SERVER_TIMESTAMP
        })
        time.sleep(0.05)


# TODO: refactor - return (product_id, request_id) tuple instead
@gen_bp.route("/generate-comments", methods=["POST"])
def generate_comments() -> Response:
    """
    Handles the generation of comments for a product based on a POST request.

    This endpoint processes a request to generate comments for a specified product. It 
    validates the input data, retrieves or creates the associated product in Firestore, 
    generates an initial batch of comments, and if necessary, initiates a background 
    process to generate additional comments.

    :return: A JSON response containing the status of the request, the product ID, gen_request ID, and the 
             initial set of generated comments. Returns an appropriate error message and 
             status code if the request fails.
    """
    try:
        data = request.get_json()
        validated_data = _extract_and_validate_data(data)
        
        if validated_data is None:
            return jsonify({"error": "Invalid input data."}), 400

        user_ref, product_ref = _get_or_create_product(
            validated_data["user_id"], 
            validated_data["product_link"], 
            validated_data["num_comments_requested"], 
            validated_data["product_data"]
        )
        
        if product_ref is None:
            return jsonify({"warning": "Duplicate request detected or user does not exist."}), 409

        gen_request_ref = _create_gen_request(
            product_ref,
            int(validated_data["num_comments_requested"]),
            pollution_level=validated_data["pollution_level"]
        )

        initial_comments = _generate_initial_comments(
            user_ref, product_ref, # necessary for updating purposes
            gen_request_ref,
            pollution_level=validated_data["pollution_level"],
            num_request_comments=int(validated_data["num_comments_requested"]),
            product_data=validated_data["product_data"]
        )
        
        # multithread if necessary (more than 1 page of comments requested)
        '''if int(validated_data["num_comments_requested"]) > 50:
            print("\t\tMore than 50 comments requested, kicking off multithread")
            executor = ThreadPoolExecutor(max_workers=1)
            executor.submit(
                _generate_remaining_comments, 
                user_ref, product_ref,
                gen_request_ref, 
                int(validated_data["num_comments_requested"]), 
                len(initial_comments)
            )
        else:
            print("\t\tLessthan 50 comments requested, no multithreading", validated_data["num_comments_requested"])
        '''
        return jsonify({"status": "success", "product_id": product_ref.id, "gen_request_id": gen_request_ref.id, "initial_comments": initial_comments}), 201
    
    except Exception as e:
        print("\t\t@generate_comments: MAJOR ERROR", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500


@gen_bp.route("/poll-comments", methods=["GET"])
def poll_comments() -> Response:
    """
    Allows clients to poll for new comments and check the generation status of a product request.

    This endpoint handles GET requests that poll for newly generated comments associated 
    with a specific product. Clients can specify a timestamp to retrieve comments that 
    were generated after that time. The endpoint returns the new comments and the total 
    number of comments generated for the product. Requires the passing in of user_id, product_id,
    and gen_request_id in order to access the data per Firestore"s hierarchical structure.

    :return: A JSON response containing the status, new comments since the last poll, and 
             the total number of comments generated for the product. If an error occurs, 
             the response contains an error message and the appropriate status code.
    """
    try:
        # extract query parameters
        user_id = request.args.get("user_id")
        product_id = request.args.get("product_id")
        gen_request_id = request.args.get("gen_request_id")
        last_comment_timestamp = request.args.get("last_comment_timestamp", None)

        print(f"\tPolling comments for product_id: {product_id} with last_comment_timestamp: {last_comment_timestamp}")

        if not user_id or not product_id:
            return jsonify({"error": "User ID and Product ID are required."}), 400

        user_ref = db.collection("users").document(user_id)
        product_ref = user_ref.collection("products").document(product_id)
        gen_request_ref = product_ref.collection("gen_requests").document(gen_request_id)
        gen_request_doc = gen_request_ref.get()

        if not gen_request_doc.exists:
            print("\t\tERROR @poll_comments - Gen request document not found.")
            return jsonify({"error": "Product document not found."}), 404

        # Query for new comments in the generated_comments subcollection
        generated_comments_ref = gen_request_ref.collection("generated_comments")
        
        if last_comment_timestamp:
            # Convert string timestamp to datetime
            last_comment_dt = datetime.fromisoformat(last_comment_timestamp)
            new_comments_query = generated_comments_ref.where("timestamp", ">", last_comment_dt).order_by("timestamp")
        else:
            new_comments_query = generated_comments_ref.order_by("timestamp")
        
        new_comments_docs = new_comments_query.get()

        # Collect new comments
        new_comments = [
            {
                "comment": doc.get("comment"),
                "relevancy_score": doc.get("relevancy_score"),
                "offensivity_score": doc.get("offensivity_score"),
                "timestamp": doc.get("timestamp").isoformat()
            }
            for doc in new_comments_docs
        ]

        total_comments = gen_request_doc.get("num_comments_generated")

        print("\t\tDebuggg @poll endpoint", total_comments)

        return jsonify({
            "status": "success",
            "new_comments": new_comments,
            "total_comments": total_comments
        }), 200

    except Exception as e:
        print("\t\tMAJOR ERROR @poll_comments", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500