import datetime
from flask import Blueprint, request, jsonify
import threading
from .auth import db
from firebase_admin import firestore
from furl import furl
from datetime import datetime, timedelta, timezone
from urllib.parse import unquote


gen_bp = Blueprint('gen', __name__)

# Convert URL that may have more than one possible representation into a stripped standard form
def canonicalize_url(link: str) -> str:
    f = furl(unquote(link))
    f.args = {}
    f.fragment = ''
    return f.url


@gen_bp.route('/generate-comments', methods=['POST'])
def generate_comments():
    try:
        data = request.get_json()
        # print("Reached API endpoint /generate-comments with data\n")
        # print(data)

        user_id = data['user_id']
        product_link = canonicalize_url(data['link'])
        num_requested_comments = data['numCommentsFirstPage']
        pollution_level = data['pollutionLevel']

        product_data = {
            'url': product_link, #data.get('url'),
            'product_name': "Lounge Chairs", #data.get('product_name'),
            'description': "Herman Miller, super expensive", #data.get('description'),
            'est_price': "$5,595.00" #data.get('est_price')
        }

        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        # Check if user exists
        if not user_doc.exists:
            return jsonify({"error": "User does not exist."}), 404

        # Create the product with an auto-generated ID
        products_ref = user_ref.collection('products')


        # Query to check if the product already exists based on the provided URL and timestamp
        products_ref = user_ref.collection('products')
        existing_product_query = products_ref.where('url', '==', product_link).get()

        if existing_product_query:
            product_ref = existing_product_query[0].reference  # Get the first matching document reference

            # Check if the product was updated within the last 5 seconds
            last_updated = existing_product_query[0].get('last_updated')

            now = datetime.now(timezone.utc)
            five_seconds_ago = now - timedelta(seconds=5)
            five_seconds_later = now + timedelta(seconds=5)
            
            if last_updated and last_updated >= five_seconds_ago and last_updated <= five_seconds_later:
                return jsonify({"warning": "Duplicate request detected.", "message": "Product with this URL already exists in the store and was created very recently."}), 409

            # If the request is not a duplicate, update the existing document
            product_ref.update({
                'total_comments': firestore.Increment(num_requested_comments),
                'last_updated': firestore.SERVER_TIMESTAMP
            })

        else:
            # If the product does not exist, create a new document
            product_ref = products_ref.document()  # Get a new document reference
            product_ref.set({
                'url': product_data['url'],
                'product_name': product_data['product_name'],
                'description': product_data['description'],
                'total_comments': num_requested_comments,
                'est_price': product_data['est_price'],
                'last_updated': firestore.SERVER_TIMESTAMP
            })

        initial_comments = [f"Comment numba {i+1}" for i in range(50)]

        # Store each comment in the `generated_comments` subcollection
        generated_comments_ref = product_ref.collection('generated_comments')
        for comment in initial_comments:
            generated_comments_ref.add({
                'comment': comment,
                'relevancy_score': 0.5,  # Placeholder score, adjust as needed
                'offensivity_score': 0.1,  # Placeholder score, adjust as needed
                'timestamp': firestore.SERVER_TIMESTAMP
            })

        user_ref.update({
            'total_generations': firestore.Increment(num_requested_comments)
        })

        return jsonify({"status": "success", "product_id": product_ref.id}), 201
    
    except Exception as e:
        print("\t\tMAJOR ERROR", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500


# This function runs in a background thread to generate and store the remaining comments if the total requested count exceeds 50.
def generate_remaining_comments(user_id, product_id, remaining_count):
    comments_ref = db.collection('users').document(user_id).collection('products').document(product_id).collection('generated_comments')

    remaining_comments = [f"Comment numba {i+51}" for i in range(remaining_count)]
    for comment in remaining_comments:
        comment_doc = comments_ref.document()
        comment_doc.set({
            'comment': comment,
            'relevancy_score': 0.5,  # Replace with actual score
            'offensivity_score': 0.1,  # Replace with actual score
            'timestamp': firestore.SERVER_TIMESTAMP
        })

    # Update the product document to mark generation as complete
    product_ref = db.collection('users').document(user_id).collection('products').document(product_id)
    # Once all comments are generated and stored, the product document’s generation_status is updated to "complete".
    product_ref.update({
        'generation_status': 'complete'
    })

# This route allows the client to poll for new comments and check the generation status.
@gen_bp.route('/poll-comments', methods=['GET'])
def poll_comments():
    # The API expects user_id and product_id as query parameters.
    user_id = request.args.get('user_id')
    product_id = request.args.get('product_id')
    last_timestamp = request.args.get('last_timestamp')

    if not user_id or not product_id:
        return jsonify({'error': 'Missing user_id or product_id'}), 400

    product_ref = db.collection('users').document(user_id).collection('products').document(product_id)
    product_doc = product_ref.get()

    if not product_doc.exists:
        return jsonify({'error': 'Product not found'}), 404

    product_data = product_doc.to_dict()
    generation_status = product_data.get('generation_status', 'in_progress')

    # The comments are queried from Firestore, ordered by timestamp.
    comments_query = product_ref.collection('generated_comments').order_by('timestamp')

    if last_timestamp:
        comments_query = comments_query.start_after(last_timestamp)

    new_comments_docs = comments_query.get()

    new_comments = []
    for doc in new_comments_docs:
        new_comments.append({
            'comment': doc.get('comment'),
            'relevancy_score': doc.get('relevancy_score'),
            'offensivity_score': doc.get('offensivity_score'),
            'timestamp': doc.get('timestamp')
        })

    return jsonify({
        'generation_status': generation_status,
        'new_comments': new_comments
    })
