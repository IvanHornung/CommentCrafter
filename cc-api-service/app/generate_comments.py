import datetime
from typing import Any, Dict, Optional
from flask import Blueprint, Response, request, jsonify
import threading
from .auth import db
from firebase_admin import firestore
from furl import furl
from datetime import datetime, timedelta, timezone
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor
import time


gen_bp = Blueprint('gen', __name__)

# Convert URL that may have more than one possible representation into a stripped standard form
def canonicalize_url(link: str) -> str:
    f = furl(unquote(link))
    f.args = {}
    f.fragment = ''
    return f.url

def _extract_and_validate_data(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    user_id = data.get('user_id')
    product_link = canonicalize_url(data.get('link', ''))
    num_requested_comments = data.get('numRequestedComments', 50)
    pollution_level = data.get('pollutionLevel', 0)

    product_data = {
        'url': product_link,
        'product_name': "Lounge Chairs",
        'description': "Herman Miller, super expensive",
        'est_price': "$5,595.00"
    }

    if not user_id or not product_link:
        return None

    return {
        'user_id': user_id,
        'product_link': product_link,
        'num_requested_comments': num_requested_comments,
        'pollution_level': pollution_level,
        'product_data': product_data
    }

def _get_or_create_product(user_id: str, product_link: str, num_requested_comments: int, product_data: Dict[str, str]) -> Optional[firestore.DocumentReference]:
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return None

    products_ref = user_ref.collection('products')
    existing_product_query = products_ref.where('url', '==', product_link).get()

    if existing_product_query:
        product_ref = existing_product_query[0].reference  
        last_updated = existing_product_query[0].get('last_updated')

        now = datetime.now(timezone.utc)
        five_seconds_ago = now - timedelta(seconds=5)
        five_seconds_later = now + timedelta(seconds=5)
        
        if last_updated and five_seconds_ago <= last_updated <= five_seconds_later:
            return None

        product_ref.update({
            'total_comments': firestore.Increment(num_requested_comments),
            'last_updated': firestore.SERVER_TIMESTAMP
        })

    else:
        product_ref = products_ref.document()  
        product_ref.set({
            'url': product_data['url'],
            'product_name': product_data['product_name'],
            'description': product_data['description'],
            'total_comments': num_requested_comments,
            'est_price': product_data['est_price'],
            'last_updated': firestore.SERVER_TIMESTAMP
        })

    return product_ref

def _generate_initial_comments(product_ref: firestore.DocumentReference, num_initial_comments: int = 50) -> list[str]:
    initial_comments = [f"Comment numba {i+1}" for i in range(num_initial_comments)]
    generated_comments_ref = product_ref.collection('generated_comments')

    for comment in initial_comments:
        generated_comments_ref.add({
            'comment': comment,
            'relevancy_score': 0.5,  
            'offensivity_score': 0.1,  
            'timestamp': firestore.SERVER_TIMESTAMP
        })
    
    return initial_comments

# This function runs in a background thread to generate and store the remaining comments if the total requested count exceeds 50.
def _generate_remaining_comments(product_ref, total_comments, num_initial_comments):
    remaining_comments = total_comments - num_initial_comments
    comments = [f"Multithread ahh Comment numba {i + num_initial_comments + 1}" for i in range(remaining_comments)]
    
    generated_comments_ref = product_ref.collection('generated_comments')
    for comment in comments:
        generated_comments_ref.add({
            'comment': comment,
            'relevancy_score': 0.5,  # Placeholder 
            'offensivity_score': 0.1,  # Placeholder
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        time.sleep(0.05)

@gen_bp.route('/generate-comments', methods=['POST'])
def generate_comments() -> Response:
    try:
        data = request.get_json()
        validated_data = _extract_and_validate_data(data)
        
        if validated_data is None:
            return jsonify({"error": "Invalid input data."}), 400

        product_ref = _get_or_create_product(
            validated_data['user_id'], 
            validated_data['product_link'], 
            validated_data['num_requested_comments'], 
            validated_data['product_data']
        )
        
        if product_ref is None:
            return jsonify({"warning": "Duplicate request detected or user does not exist."}), 409

        initial_comments = _generate_initial_comments(product_ref)
        
        # multithread if necessary (more than 1 page of comments requested)
        if int(validated_data['num_requested_comments']) > 50:
            print("\t\tMore than 50 comments requested, kicking off multithread")
            executor = ThreadPoolExecutor(max_workers=1)
            executor.submit(
                _generate_remaining_comments, 
                product_ref, 
                validated_data['num_requested_comments'], 
                len(initial_comments)
            )
        else:
            print("\t\tLessthan 50 comments requested, no multithreading", validated_data['num_requested_comments'])

        return jsonify({"status": "success", "product_id": product_ref.id, "initial_comments": initial_comments}), 201
    
    except Exception as e:
        print("\t\tMAJOR ERROR", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500


# This route allows the client to poll for new comments and check the generation status.
@gen_bp.route('/poll-comments', methods=['GET'])
def poll_comments() -> Response:
    try:
        # extract query parameters
        user_id = request.args.get('user_id')
        product_id = request.args.get('product_id')
        last_comment_timestamp = request.args.get('last_comment_timestamp', None)

        print(f"\tPolling comments for product_id: {product_id} with last_comment_timestamp: {last_comment_timestamp}")

        if not user_id or not product_id:
            return jsonify({"error": "User ID and Product ID are required."}), 400

        user_ref = db.collection('users').document(user_id)
        product_ref = user_ref.collection('products').document(product_id)
        product_doc = product_ref.get()

        if not product_doc.exists:
            print("\t\tERROR @poll_comments - Product document not found.")
            return jsonify({"error": "Product document not found."}), 404

        # Query for new comments in the generated_comments subcollection
        generated_comments_ref = product_ref.collection('generated_comments')
        
        if last_comment_timestamp:
            # Convert string timestamp to datetime
            last_comment_dt = datetime.fromisoformat(last_comment_timestamp)
            new_comments_query = generated_comments_ref.where('timestamp', '>', last_comment_dt).order_by('timestamp')
        else:
            new_comments_query = generated_comments_ref.order_by('timestamp')
        
        new_comments_docs = new_comments_query.get()

        # Collect new comments
        new_comments = [
            {
                'comment': doc.get('comment'),
                'relevancy_score': doc.get('relevancy_score'),
                'offensivity_score': doc.get('offensivity_score'),
                'timestamp': doc.get('timestamp').isoformat()
            }
            for doc in new_comments_docs
        ]

        total_comments = product_doc.get('total_comments')

        return jsonify({
            "status": "success",
            "new_comments": new_comments,
            "total_comments": total_comments
        }), 200

    except Exception as e:
        print("\t\tMAJOR ERROR @poll_comments", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500
