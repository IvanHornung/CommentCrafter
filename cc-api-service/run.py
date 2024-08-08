"""
This script serves as the simplified entry point to run the Flask application.
It imports the app from app.main and runs it if the script is executed directly.
"""

from app.main import app

if __name__ == '__main__':
    app.run()
