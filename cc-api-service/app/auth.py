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


# Initialize Firebase Admin SDK
cred = credentials.Certificate('./config/comment-crafter-firebase-adminsdk.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

auth_bp = Blueprint('auth', __name__)

logger = logging.getLogger('auth')
logging.basicConfig(level=logging.INFO)


@auth_bp.route('/create_user', methods=['POST'])
def login():
    token: str = request.json.get('token')
    if not token:
        return jsonify({'error': 'Token missing'}), 400

    try :
        return jsonify({'message': 'Token received successfully'}), 200
    except firebase_admin.auth.AuthError as e:
        logger.error(f'Auth error: {e}')
        return jsonify({'error': 'Auth error'}), 401
    except Exception as e:
        logger.error(f'Unexpected error: {e}')
        return jsonify({'error': 'Unexpected error'}), 500



@auth_bp.route('/create_userTEST', methods=['POST'])
def create_account():
    token = request.json.get('token')
    if not token:
        return jsonify({'error': 'Token missing'}), 400

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        user = auth.get_user(uid)

        # Store user data in Firestore
        user_data = {
            'username': user.username,
        }
        db.collection('users').document(user.uid).set(user_data)

        return jsonify({'message': 'User account created successfully'}), 200

    except firebase_admin.auth.AuthError as e:
        logger.error(f'Auth error: {e}')
        return jsonify({'error': 'Auth error'}), 401
    except Exception as e:
        logger.error(f'Unexpected error: {e}')
        return jsonify({'error': 'Unexpected error'}), 500