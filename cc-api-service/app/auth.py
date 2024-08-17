"""
This module contains the authentication-related routes and logic.
- It initializes the Firebase Admin SDK
- Defines the `/create_account` endpoint to handle accoutn creation by verifying Firebase Auth tokens and storing
    the user data in Firestore
"""


from flask import Blueprint, request, jsonify
import firebase_admin
from firebase_admin import credentials, auth, firestore
import logging
import os
from typing import Tuple

# Initialize Firebase Admin SDK
absolute_path = os.path.dirname( # obtain absolute path of one level about this file"s directory (/app)
    os.path.dirname(os.path.abspath(__file__)) 
)
config_path = os.path.join(absolute_path, "config", "comment-crafter-firebase-adminsdk.json")
cred = credentials.Certificate(config_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

auth_bp = Blueprint("auth", __name__)

logger = logging.getLogger("auth")
logging.basicConfig(level=logging.INFO)


@auth_bp.route("/create_user", methods=["POST"])
def create_user_account():
    try:
        data = request.get_json()
        current_time = firestore.SERVER_TIMESTAMP

        user_id, username = data.get("user_id"), data.get("username")
        if not user_id or not username:
            return jsonify({"error": "User ID and username not found"}), 400
        
        pfp = data.get("pfp", "")

        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()

        if user_doc.exists: #logic for if user exists
            # update last login and pfp
            logger.info(f"User {user_id} already exists, updating entry...")
            user_ref.update({
                "last_login": current_time,
                "pfp": pfp
            })
            return jsonify({"message": "User already exists, user data updated"}), 200
        else : # logic for if user doesn"t exist
            # create new user document
            user_ref.set({
                "user_id": user_id,
                "username": username,
                "pfp": pfp,
                "total_comment_generations": 0,
                "total_gen_requests": 0,
                "created_at": current_time,
                "last_login": current_time
            })
            logger.info(f"User {user_id} created successfully")
            return jsonify({"message": "User created successfully"}), 201
    
    except Exception as e:
        return jsonify({"error" : str(e)}), 500
