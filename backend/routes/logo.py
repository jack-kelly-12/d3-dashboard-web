from flask import Blueprint, redirect, jsonify

from db import get_db_connection

bp = Blueprint('logo', __name__, url_prefix='/api')

S3_BUCKET_BASE = "https://d3-dashboard-kellyjc.s3.us-east-2.amazonaws.com/team_images"


@bp.get('/team-logo/<int:org_id>')
def team_logo(org_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT ncaa_slug FROM team_information WHERE org_id = ? LIMIT 1",
            (org_id,)
        )
        row = cursor.fetchone()
        
        if not row or not row["ncaa_slug"]:
            return jsonify({"error": "Team not found"}), 404
        
        slug = row["ncaa_slug"]
        logo_url = f"{S3_BUCKET_BASE}/{slug}.svg"
        
        return redirect(logo_url, code=302)
        
    finally:
        conn.close()


