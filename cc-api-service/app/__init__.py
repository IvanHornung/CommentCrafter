"""
This module initializes the Flask application
- It registers Blueprints (modular components for routing) 
- Sets up the overall structure of the application.
"""

from flask import Flask
from .auth import auth_bp
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(auth_bp, url_prefix='/auth') # ex:100/auth/createUser

    return app
