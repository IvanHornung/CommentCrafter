from flask import Blueprint, request, jsonify
import threading
from .auth import db
from firebase_admin import firestore


gen_bp = Blueprint('gen', __name__)

@gen_bp.route('/generate-comments', methods=['POST'])
def generate_comments():
    print("Reached API endpoint /generate-comments with data\n")
    print(request.get_json())

    initial_comments = [f"Comment numba {i+1}" for i in range(50)]

    return jsonify({
        'status': 'success',
        'processedComments': initial_comments
    })

# This route handles the generation of comments for a given user and product.
@gen_bp.route('/generate-commentsTEST', methods=['POST'])
def generate_commentsTEST():
    # The API expects a JSON body containing user_id, product_id, and optionally commentCount (number of comments to generate).
    data = request.get_json()
    user_id = data['user_id']
    # product_id = data['product_id'] # TODO: generate this
    comment_count = data.get('commentCount', 0)

    # Generate the first 50 comments immediately
    initial_comments = [f"Comment numba {i+1}" for i in range(min(50, comment_count))]
    
    comments_ref = db.collection('users').document(user_id).collection('products').document(product_id).collection('generated_comments')
    # These comments are then stored in Firestore under a collection path derived from user_id and product_id.
    for comment in initial_comments:
        comment_doc = comments_ref.document()
        comment_doc.set({
            'comment': comment,
            'relevancy_score': 0.5,  # Replace with actual score
            'offensivity_score': 0.1,  # Replace with actual score
            'timestamp': firestore.SERVER_TIMESTAMP
        })

    product_ref = db.collection('users').document(user_id).collection('products').document(product_id)
    # If comment_count exceeds 50, a background thread is started to handle the generation of the remaining comments.
    if comment_count > 50:
        # The product document's generation_status is set to "in_progress" to indicate that more comments are being generated.
        product_ref.update({
            'generation_status': 'in_progress'
        })

        threading.Thread(target=generate_remaining_comments, \
                         args=(user_id, product_id, comment_count - 50)).start()
    else:
        # If comment_count is 50 or less, the generation_status is immediately set to "complete".
        product_ref.update({
            'generation_status': 'complete'
        })
    
    return jsonify({
        'status': 'success',
        'processedComments': initial_comments
    })


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
