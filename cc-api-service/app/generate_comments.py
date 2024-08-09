from flask import Blueprint, request, jsonify

gen_bp = Blueprint('gen', __name__)

@gen_bp.route('/generate-comments', methods=['POST'])
def generate_comments():
    data = request.get_json()
    print(data)

    comment_count = data.get('commentCount', 0)
    response = {
        'status': 'success',
        'processedComments': [f"Comment numba {i}" for i in range(comment_count)]
    }
    
    return jsonify(response)