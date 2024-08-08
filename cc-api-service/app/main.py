"""
This module is the entry point for creating the Flask application instance. It calls `create_app`
to initialize and configure the app. It can be run directly to start the Flask development server.
"""

from app import create_app
from flask import Flask


app: Flask = create_app()

# check if being run directly (as opposed to being imported from a module)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
