from flask import Blueprint, Response, jsonify, request
from .auth import db
from .data_modules import print_info
from firebase_admin import firestore


history_bp = Blueprint("history", __name__)

@history_bp.route("/retrieve-user-summary", methods=["GET"]) 
def provide_user_summary() -> Response:
    print_info("Reached /retrieve-user-summary")
    try:
        user_id = request.args.get("user_id")
        
        print(f"\tRetrieving user gen summary for user: {user_id}")

        if not user_id:
            return jsonify({"error": "User ID is required."}), 400
        
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return jsonify({"error": "User not found."}), 404
                
        total_comment_generations = user_doc.get("total_comment_generations")
        total_gen_requests = user_doc.get("total_gen_requests")

        return jsonify({
            "total_comment_generations": total_comment_generations,
            "total_gen_requests": total_gen_requests, 
        }), 200
    
    except Exception as e:
        print("\t\tError @provide_user_summary", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500
    

@history_bp.route("/retrieve-user-product-request", methods=["GET"])
def provide_user_products() -> Response:
    print_info("Reached /retrieve-user-product-request")
    try:
        user_id = request.args.get("user_id")
        user_ref = db.collection("users").document(user_id)
        products_ref = user_ref.collection("products")
        
        # query to get products sorted by most recent
        products_query = products_ref.order_by("last_updated", direction=firestore.Query.DESCENDING)
        products_docs = products_query.stream()

        # extract required information
        products_list = []
        for doc in products_docs:
            product_data = doc.to_dict()
            product_info = {
                "product_id": doc.id,
                "product_name": product_data.get("product_name"),
                "total_comments": product_data.get("total_comments"),
                "total_gen_requests": product_data.get("total_gen_requests"),
            }
            products_list.append(product_info)

        return jsonify(products_list), 200
    except Exception as e:
        print("\t\tError @provide_user_summary", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500
    