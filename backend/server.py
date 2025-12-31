from flask import Flask  
from flask_cors import CORS
from flasgger import Swagger
import os
import logging
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

load_dotenv()

ENV = os.getenv('FLASK_ENV', 'production')
IS_DEV = ENV == 'development'

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
from routes.api_keys import bp as api_keys_bp


app = Flask(__name__, static_folder='../frontend/build/', static_url_path='/')

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max upload

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
}

swagger_template = {
    "info": {
        "title": "D3 Dashboard API",
        "description": (
            "API documentation for D3 Dashboard.\n\n"
            "## Authentication\n\n"
            "All API endpoints require authentication via ONE of:\n\n"
            "### Option A: Firebase ID Token (website/mobile)\n"
            "```\n"
            "curl -H \"Authorization: Bearer <firebase_id_token>\" https://d3-dashboard.com/api/batting\n"
            "```\n\n"
            "### Option B: API Key (programmatic access)\n"
            "```\n"
            "curl -H \"X-API-Key: your_api_key\" https://d3-dashboard.com/api/batting\n"
            "```\n\n"
            "Get an API key at [d3-dashboard.com/api-keys](https://d3-dashboard.com/api-keys)\n\n"
            "## Rate Limits\n\n"
            "Rate limits vary by authentication type:\n\n"
            "| User Type | Requests/min | Burst |\n"
            "|-----------|--------------|-------|\n"
            "| Anonymous | 120 | 200 |\n"
            "| Signed-in | 200 | 300 |\n"
            "| API Key | 300 | 400 |\n\n"
            "Rate limit headers are included in all responses:\n"
            "- `X-RateLimit-Limit`: Requests allowed per minute\n"
            "- `X-RateLimit-Remaining`: Requests remaining in window\n"
            "- `X-RateLimit-Reset`: Unix timestamp when window resets"
        ),
        "version": "1.0.0",
    },
    "basePath": "/api",
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "Authorization",
            "description": "Firebase ID token: Bearer <token>"
        },
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API key for programmatic access"
        }
    },
    "security": [{"BearerAuth": []}, {"ApiKeyAuth": []}],
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

CERT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH')

cred = credentials.Certificate(CERT_PATH)
firebase_admin.initialize_app(cred)


PROD_ORIGINS = [
    "https://d3-dashboard.com",
    "https://www.d3-dashboard.com",
]

DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

ALLOWED_ORIGINS = PROD_ORIGINS + (DEV_ORIGINS if IS_DEV else [])

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-API-Key"]
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
app.register_blueprint(api_keys_bp)

@app.get("/api/health")
def api_health():
    return {"ok": True}, 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    
    if IS_DEV:
        print(f"Running in DEVELOPMENT mode on port {port}")
        print(f"   Allowed origins: {ALLOWED_ORIGINS}")
        app.run(host='0.0.0.0', port=port, debug=True)
    else:
        app.run(host='0.0.0.0', port=port)
