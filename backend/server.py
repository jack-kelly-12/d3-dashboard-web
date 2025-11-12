from flask import Flask  
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
import logging
from routes.batting import bp as batting_bp
from routes.pitching import bp as pitching_bp
from routes.conferences import bp as conferences_bp
from routes.logo import bp as logo_bp
from routes.leaderboards import bp as leaderboards_bp
from routes.uploads import bp as uploads_bp
from routes.team_data import bp as team_data_bp
from routes.player_data import bp as player_data_bp
from routes.guts import bp as guts_bp
from routes.games import bp as games_bp



app = Flask(__name__, static_folder='../frontend/build/', static_url_path='/')
load_dotenv()
CERT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH')

cred = credentials.Certificate(CERT_PATH)
firebase_admin.initialize_app(cred)


CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://d3-dashboard.com",
            "https://www.d3-dashboard.com",
            "http://d3-dashboard.com",
            "http://www.d3-dashboard.com",
            "http://localhost:3000",
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.register_blueprint(batting_bp)
app.register_blueprint(pitching_bp)
app.register_blueprint(conferences_bp)
app.register_blueprint(logo_bp)
app.register_blueprint(leaderboards_bp)
app.register_blueprint(uploads_bp)
app.register_blueprint(team_data_bp)
app.register_blueprint(player_data_bp)
app.register_blueprint(guts_bp)
app.register_blueprint(games_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
