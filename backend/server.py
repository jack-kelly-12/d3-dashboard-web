from typing import Dict, Optional
from datetime import datetime
from flask import jsonify
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import sqlite3
import pandas as pd
from io import StringIO
import os
from PIL import Image
import io
from flask import Response
import os
import logging
from llm_insights import InsightsProcessor
from dotenv import load_dotenv
import stripe
import firebase_admin
import json
from firebase_admin import firestore, auth, credentials
from functools import wraps
import uuid


app = Flask(__name__, static_folder='../frontend/build/', static_url_path='/')
load_dotenv()
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK = os.getenv('STRIPE_WEBHOOK_SECRET')
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
            "https://api.stripe.com"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "stripe-signature"]
    }
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = 'ncaa.db'


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def require_premium(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        division = request.args.get('division', type=int, default=3)

        if division != 3:
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({"error": "Premium subscription required"}), 403

            try:
                token = auth_header.split('Bearer ')[1]
                decoded_token = auth.verify_id_token(token)
                user_id = decoded_token['uid']

                db = firestore.client()
                sub_doc = db.collection(
                    'subscriptions').document(user_id).get()

                if not sub_doc.exists:
                    return jsonify({"error": "Premium subscription required"}), 403

                data = sub_doc.to_dict()
                is_active = (
                    data.get('status') == 'active' and
                    data.get('expiresAt', datetime.now()
                             ).timestamp() > datetime.now().timestamp()
                )

                if not is_active:
                    return jsonify({"error": "Premium subscription required"}), 403

            except Exception as e:
                print(f"Auth error: {str(e)}")
                return jsonify({"error": "Premium subscription required"}), 403

        return f(*args, **kwargs)
    return decorated_function


@app.route('/api/batting_war/<int:year>', methods=['GET'])
@require_premium
def get_batting_war(year):
    if year < 2021 or year > 2025:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2025."}), 400

    division = request.args.get('division', type=int, default=3)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT b.*, i.prev_team_id, i.conference_id
        FROM batting_war b
        LEFT JOIN ids_for_images i ON b.Team = i.team_name
        WHERE b.Division = ? AND b.Season = ?
        ORDER BY b.WAR DESC
    """

    cursor.execute(query, (division, year))

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/pitching_war/<int:year>', methods=['GET'])
@require_premium
def get_pitching_war(year):
    if year < 2021 or year > 2025:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2025."}), 400

    division = request.args.get('division', type=int, default=3)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT p.*, i.prev_team_id, i.conference_id
        FROM pitching_war p
        LEFT JOIN ids_for_images i ON p.Team = i.team_name
        WHERE p.Division = ? AND p.Season = ?
        ORDER BY p.WAR DESC
    """

    cursor.execute(query, (division, year))

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/batting_team_war/<int:year>', methods=['GET'])
@require_premium
def get_batting_team_war(year):
    if year < 2021 or year > 2025:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2025."}), 400

    division = request.args.get('division', type=int, default=3)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT b.*, i.prev_team_id, i.conference_id
        FROM batting_team_war b
        LEFT JOIN ids_for_images i ON b.Team = i.team_name
        WHERE b.Division = ? AND b.Season = ?
        ORDER BY b.WAR DESC
    """

    cursor.execute(query, (division, year))

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/pitching_team_war/<int:year>', methods=['GET'])
@require_premium
def get_pitching_team_war(year):
    if year < 2021 or year > 2025:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2025."}), 400

    division = request.args.get('division', type=int, default=3)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT p.*, i.prev_team_id, i.conference_id
        FROM pitching_team_war p
        LEFT JOIN ids_for_images i ON p.Team = i.team_name
        WHERE p.Division = ? AND p.Season = ?
        ORDER BY p.WAR DESC
    """

    cursor.execute(query, (division, year))

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/guts', methods=['GET'])
@require_premium
def get_guts():
    division = request.args.get('division', default=3, type=int)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3"}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"""SELECT * FROM guts_constants WHERE Division = ?""", (division,))
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/park-factors', methods=['GET'])
@require_premium
def get_pf():
    division = request.args.get('division', default=3, type=int)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    table_name = f"d{division}_park_factors"
    cursor.execute(f"""SELECT * FROM {table_name}""")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/teams', methods=['GET'])
@require_premium
def get_teams():
    division = request.args.get('division', 3, type=int)
    year = request.args.get('year', 2024, type=int)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT DISTINCT Team as team_name FROM batting_war WHERE Division = ? AND Season = ?",
        (division, year)
    )
    data = cursor.fetchall()

    conn.close()

    teams = [{"team_id": idx + 1, "team_name": row[0]}
             for idx, row in enumerate(data)]

    return jsonify(teams)


@app.route('/api/players-hit/<team_name>', methods=['GET'])
@require_premium
def get_team_players(team_name):
    try:
        division = request.args.get('division')
        year = request.args.get('year', '2025')

        if not division:
            return jsonify({"error": "Division parameter is required"}), 400

        try:
            year = int(year)
            division = int(division)
        except ValueError:
            return jsonify({"error": "Year and division must be valid numbers"}), 400

        if division not in [1, 2, 3]:
            return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DISTINCT Team
            FROM batting_war
            WHERE Division = ? AND Season = ? AND Team = ?
            """, (division, year, team_name))

        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": f"No data found for team {team_name} in Division {division} for year {year}"}), 404

        cursor.execute("""
            SELECT Player,
                   player_id,
                   Pos,
                   BA,
                   OBPct as OBP,
                   SlgPct as SLG,
                   HR,
                   SB,
                   WAR
            FROM batting_war
            WHERE Team = ?
            AND Season = ?
            AND Division = ?
            ORDER BY WAR DESC
            """, (team_name, year, division))

        columns = [col[0] for col in cursor.description]
        data = [dict(zip(columns, row)) for row in cursor.fetchall()]

        conn.close()

        if not data:
            return jsonify({"error": "No players found"}), 404

        return jsonify(data)

    except Exception as e:
        print(f"Error in get_team_players: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/players-pitch/<team_name>', methods=['GET'])
@require_premium
def get_team_pitchers(team_name):
    division = request.args.get('division', type=int)
    year = request.args.get('year', '2025')

    year = int(year)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT DISTINCT Team FROM pitching_war WHERE Division = ? AND Season = ? AND Team = ?",
        (division, year, team_name)
    )
    if not cursor.fetchone():
        return jsonify({"error": "Invalid team name"}), 404

    cursor.execute("""
        SELECT Player,
               player_id,
               ERA,
               FIP,
               "K%",
               "BB%",
               IP,
               WAR
        FROM pitching_war
        WHERE Team = ? AND Division = ? AND Season = ?
    """, (team_name, division, year))

    data = [dict(zip([col[0] for col in cursor.description], row))
            for row in cursor.fetchall()]

    conn.close()
    return jsonify(data)


@app.route('/api/expected-runs', methods=['GET'])
@require_premium
def get_expected_runs():
    year = request.args.get('year', '2025')
    division = request.args.get('division', default=3, type=int)

    try:
        year = int(year)
        if not (2021 <= year <= 2025):
            return jsonify({"error": "Invalid year. Must be between 2021 and 2025."}), 400

        if not (1 <= division <= 3):
            return jsonify({"error": "Invalid division. Must be between 1 and 3."}), 400
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM expected_runs
        WHERE Division = ? AND Year = ?
    """, (division, year))

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/player-percentiles/<string:player_id>/<int:year>/<int:division>', methods=['GET'])
def get_player_percentiles(player_id, year, division):
    conn = get_db_connection()
    cursor = conn.cursor()
    response = {"batting": None, "pitching": None}

    try:
        # Check batting stats
        cursor.execute("""
            SELECT * FROM batting_war
            WHERE player_id = ? AND Division = ? AND Season = ?
        """, (player_id, division, year))
        player = cursor.fetchone()

        if player:
            cursor.execute("""
                SELECT BA, OBPct, SlgPct, "wOBA", "OPS+", "Batting",
                       "Baserunning", "WPA/LI", WAR, PA, "wRC+", "WPA", "REA", "K%", "BB%"
                FROM batting_war
                WHERE PA > 25 AND Division = ? AND Season = ?
                ORDER BY PA DESC
            """, (division, year))
            all_players = cursor.fetchall()
            player_stats = dict(player)

            percentiles = {}
            for stat in ['BA', 'OBPct', 'SlgPct', 'wOBA', 'OPS+', 'Batting',
                         'Baserunning', 'WPA/LI', 'WAR', 'wRC+', 'WPA', 'REA', 'K%', 'BB%']:
                values = [p[stat] for p in all_players if p[stat] is not None]
                reverse_stats = ['K%']
                player_value = player_stats[stat]
                if values and player_value is not None:
                    values.sort()
                    index = sum(1 for x in values if (
                        x >= player_value if stat in reverse_stats else x <= player_value))
                    percentile = round((index / len(values)) * 100)
                    percentiles[f"{stat}Percentile"] = percentile
                    percentiles[stat] = player_value

            response["batting"] = {
                "type": "batting",
                "stats": percentiles,
                "qualified": player_stats['PA'] > 25,
                "paThreshold": 25,
                "playerPA": player_stats['PA'],
                "season": year,
                "division": division
            }

        cursor.execute("""
            SELECT * FROM pitching_war
            WHERE player_id = ? AND Division = ? AND Season = ?
        """, (player_id, division, year))
        player = cursor.fetchone()

        if player:
            cursor.execute("""
                SELECT ERA, FIP, xFIP, "K%", "BB%", "K-BB%", "HR/FB", WAR, IP, RA9, "pWPA", "pREA", "pWPA/LI"
                FROM pitching_war
                WHERE IP > 10 AND Division = ? AND Season = ?
                ORDER BY IP DESC
            """, (division, year))
            all_players = cursor.fetchall()
            player_stats = dict(player)

            percentiles = {}
            reverse_stats = ['ERA', 'FIP', 'xFIP', 'BB%', 'HR/FB', 'RA9']

            for stat in ['ERA', 'FIP', 'xFIP', 'K%', 'BB%', 'K-BB%', 'RA9', 'WAR', 'pREA', 'pWPA', 'pWPA/LI']:
                values = [p[stat] for p in all_players if p[stat] is not None]
                player_value = player_stats[stat]
                if values and player_value is not None:
                    values.sort(reverse=stat in reverse_stats)
                    index = sum(1 for x in values if (
                        x >= player_value if stat in reverse_stats else x <= player_value))
                    percentile = round((index / len(values)) * 100)
                    percentiles[f"{stat}Percentile"] = percentile
                    percentiles[stat] = player_value

            response["pitching"] = {
                "type": "pitching",
                "stats": percentiles,
                "qualified": player_stats['IP'] > 10,
                "ipThreshold": 10,
                "playerIP": player_stats['IP'],
                "season": year,
                "division": division
            }

        if response["batting"] is None and response["pitching"] is None:
            return jsonify({
                "inactive": True,
                "message": f"Player not active in {year} season for division {division}"
            })

        return jsonify(response)

    finally:
        conn.close()


@app.route('/api/spraychart-data/<player_id>', methods=['GET'])
@require_premium
def get_spraychart_data(player_id):
    try:
        year = int(request.args.get('year', '2025'))
        division = int(request.args.get('division', '3'))
    except ValueError:
        return jsonify({"error": "Invalid year or division format"}), 400

    FIELD_PATTERNS = {
        "to_lf": [r'to left', r'to lf', r'left field', r'lf line', r'by lf'],
        "to_cf": [r'to center', r'to cf', r'center field', r'by cf'],
        "to_rf": [r'to right', r'to rf', r'right field', r'rf line', r'by rf'],
        "to_lf_hr": [r'homered to left', r'homered to lf', r'homers to lf', r'homers to left'],
        "to_cf_hr": [r'homered to center', r'homered to cf', r'homers to cf', r'homers to center'],
        "to_rf_hr": [r'homered to right', r'homered to rf', r'homers to rf', r'homers to right'],
        "to_3b": [r'to 3b', r'to third', r'third base', r'3b line', r'by 3b', r'3b to 2b'],
        "to_ss": [r'ss to 2b', r'to ss', r'to short', r'shortstop', r'by ss'],
        "up_middle": [r'up the middle', r'to pitcher', r'to p', r'to c', r'by p', r'by c', r'to pitcher', r'to catcher'],
        "to_2b": [r'2b to ss', r'to 2b', r'to second', r'second base', r'by 2b'],
        "to_1b": [r'to 1b', r'to first', r'first base', r'1b line', r'by 1b', r'1b to ss', r'1b to p', r'1b to 2b'],
    }

    hit_counts = {location: 0 for location in FIELD_PATTERNS.keys()}

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT r.player_name, r.team_name, r.bats 
            FROM rosters r
            WHERE r.player_id = ? AND r.year = ? AND r.division = ?
            LIMIT 1
        """, (player_id, year, division))

        player_info = cursor.fetchone()
        if not player_info:
            return jsonify({"error": f"Player not found for ID {player_id} in year {year}, division {division}"}), 404

        player_info_dict = dict(player_info)
        player_name = player_info_dict["player_name"]
        team_name = player_info_dict["team_name"]
        bats = player_info_dict.get("bats", "R")

        cursor.execute("""
            SELECT description 
            FROM pbp
            WHERE batter_id = ? AND year = ? AND division = ?
        """, (player_id, year, division))

        pbp_data = [{"description": row["description"]}
                    for row in cursor.fetchall()]

        cursor.execute("""
            SELECT * FROM splits
            WHERE batter_id = ? AND Year = ? AND Division = ?
        """, (player_id, year, division))
        splits_data = cursor.fetchone()

        cursor.execute("""
            SELECT * FROM batted_ball
            WHERE batter_id = ? AND Year = ? AND Division = ?
        """, (player_id, year, division))
        batted_ball_data = cursor.fetchone()

        import re
        compiled_patterns = {}
        for location, patterns in FIELD_PATTERNS.items():
            compiled_patterns[location] = [
                re.compile(pattern, re.IGNORECASE) for pattern in patterns]  # Added re.IGNORECASE

        for play in pbp_data:
            description = play['description'].lower().split(
                '3a')[0] if play and 'description' in play else ''

            if not description:
                continue

            hr_found = False
            for location, patterns in compiled_patterns.items():
                if "_hr" in location and any(pattern.search(description) for pattern in patterns):
                    hit_counts[location] += 1
                    hr_found = True
                    break

            if not hr_found:
                for location, patterns in compiled_patterns.items():
                    if "_hr" not in location and any(pattern.search(description) for pattern in patterns):
                        hit_counts[location] += 1
                        break

        response_data = {
            "counts": hit_counts,
            "splits_data": dict(splits_data) if splits_data else {},
            "batted_ball_data": dict(batted_ball_data) if batted_ball_data else {},
            "player_id": player_id,
            "player_name": player_name,
            "team_name": team_name,
            "bats": bats,
            "year": year,
            "division": division
        }

        return jsonify(response_data)

    except Exception as e:
        import logging
        logging.error(f"Error in get_spraychart_data: {str(e)}", exc_info=True)
        return jsonify({"error": "An internal server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/player/<string:player_id>', methods=['GET'])
def get_player_stats(player_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        player_found = False
        player_name = None
        current_team = None
        current_division = None
        current_conference = None
        current_prev_team_id = None
        current_conference_id = None
        is_pitcher = False
        batting_stats = []
        pitching_stats = []
        player_info = None  # Initialize player_info to None

        for year in range(2025, 2020, -1):  # Start from most recent year and go backwards
            cursor.execute(f"""
                SELECT b.*, i.prev_team_id, i.conference_id
                FROM batting_war b
                LEFT JOIN ids_for_images i ON b.Team = i.team_name
                WHERE b.player_id = ? AND Season = ?
            """, (player_id, year))
            bat_stats = cursor.fetchone()
            if bat_stats:
                player_found = True
                batting_stats.append(dict(bat_stats))
                if not player_name or year > max(s.get('Season', 0) for s in batting_stats if 'Season' in s):
                    player_name = bat_stats["Player"]
                    current_team = bat_stats["Team"]
                    current_division = bat_stats['Division']
                    current_conference = bat_stats["Conference"]
                    current_prev_team_id = bat_stats["prev_team_id"]
                    current_conference_id = bat_stats["conference_id"]

            cursor.execute(f"""
                SELECT p.*, i.prev_team_id, i.conference_id
                FROM pitching_war p
                LEFT JOIN ids_for_images i ON p.Team = i.team_name
                WHERE p.player_id = ? AND Season = ?
            """, (player_id, year))
            pitch_stats = cursor.fetchone()
            if pitch_stats:
                player_found = True
                pitching_stats.append(dict(pitch_stats))
                if not player_name or year > max(s.get('Season', 0) for s in pitching_stats if 'Season' in s):
                    player_name = pitch_stats["Player"]
                    current_team = pitch_stats["Team"]
                    current_division = pitch_stats['Division']
                    current_conference = pitch_stats["Conference"]
                    current_prev_team_id = pitch_stats["prev_team_id"]
                    current_conference_id = pitch_stats["conference_id"]
                    is_pitcher = True

            # Try to get player info for each year, stop once we find it
            if player_info is None:
                cursor.execute("""
                    SELECT r.height, r.bats, r.throws, r.hometown, r.high_school, r.position
                    FROM rosters r
                    WHERE r.player_id = ? AND Year = ?
                """, (player_id, year))
                year_player_info = cursor.fetchone()
                if year_player_info:
                    player_info = dict(year_player_info)

        if not player_found:
            return jsonify({"error": "Player not found"}), 404

        # Sort the statistics by year for better presentation
        batting_stats.sort(key=lambda x: x['Season'], reverse=True)
        pitching_stats.sort(key=lambda x: x['Season'], reverse=True)

        is_active = any(stat.get('Season') ==
                        2025 for stat in batting_stats + pitching_stats)

        return jsonify({
            "playerId": player_id,
            "playerName": player_name,
            "currentTeam": current_team,
            "conference": current_conference,
            "division": current_division,
            "prev_team_id": current_prev_team_id,
            "conference_id": current_conference_id,
            "isPitcher": is_pitcher,
            "isActive": is_active,
            "height": player_info["height"] if player_info else None,
            "bats": player_info["bats"] if player_info else None,
            "throws": player_info["throws"] if player_info else None,
            "hometown": player_info["hometown"] if player_info else None,
            "highSchool": player_info["high_school"] if player_info else None,
            "position": player_info["position"] if player_info else None,
            "battingStats": batting_stats,
            "pitchingStats": pitching_stats
        })

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        print(f"Error fetching player stats: {e}")
        return jsonify({"error": "Failed to fetch player statistics"}), 500
    finally:
        conn.close()


@app.route('/api/search/players', methods=['GET'])
def search_players():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        exact_term = query.lower()
        starts_with_term = f"{query.lower()}%"
        contains_term = f"%{query.lower()}%"

        # Optimized query with LIMIT applied earlier
        cursor.execute("""
            SELECT DISTINCT
                player_id,
                player_name as playerName,
                team_name as team,
                conference as conference
            FROM rosters
            WHERE player_id LIKE 'd3d-%'
              AND (
                  LOWER(player_name) = ? 
                  OR LOWER(player_name) LIKE ? 
                  OR LOWER(player_name) LIKE ?
              )
            ORDER BY
                CASE
                    WHEN LOWER(player_name) = ? THEN 1
                    WHEN LOWER(player_name) LIKE ? THEN 2
                    ELSE 3
                END,
                player_name
            LIMIT 5
        """, (
            exact_term,
            starts_with_term,
            contains_term,
            exact_term,
            starts_with_term
        ))

        results = [dict(row) for row in cursor.fetchall()]

        return jsonify(results)

    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": "An error occurred while searching players"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/api/upload/rapsodo', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def upload_rapsodo():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    if 'file' not in request.files:
        response = jsonify({"error": "No file provided"})
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    try:
        content = file.read().decode('utf-8')

        player_name_index = content.find('Player Name:')
        if player_name_index != -1:
            player_name = content[player_name_index +
                                  len('Player Name:'):].split('\n')[0].strip()
        else:
            player_name = "Unknown Player"

        lines = content.split('\n')[4:]
        modified_content = '\n'.join(lines)
        csv_file = StringIO(modified_content)

        df = pd.read_csv(
            csv_file,
            delimiter=',',
            encoding='utf-8',
            on_bad_lines='skip'
        )

        processed_pitches = []
        for idx, row in df.iterrows():
            try:
                pitch_type = row.get('Pitch Type', '')
                if pd.isna(pitch_type) or str(pitch_type).strip() == '-':
                    continue
                df.loc[idx] = row.replace('-', pd.NA)

                pitch = {
                    'player': player_name,
                    'timestamp': pd.to_datetime(row['Date']).isoformat() if pd.notna(row.get('Date')) else None,
                    'type': str(pitch_type).lower(),
                    'velocity': float(row['Velocity']) if pd.notna(row.get('Velocity')) else None,
                    'spinRate': float(row['Total Spin']) if pd.notna(row.get('Total Spin')) else None,
                    'spinEff': float(row['Spin Efficiency (release)']) if pd.notna(row.get('Spin Efficiency (release)')) else None,
                    'horzBreak': float(row['HB (trajectory)']) if pd.notna(row.get('HB (trajectory)')) else None,
                    'vertBreak': float(row['VB (trajectory)']) if pd.notna(row.get('VB (trajectory)')) else None,
                    'strikeZoneX': float(row['Strike Zone Side']) if pd.notna(row.get('Strike Zone Side')) else None,
                    'strikeZoneZ': float(row['Strike Zone Height']) if pd.notna(row.get('Strike Zone Height')) else None,
                    'relSide': float(row['Release Side']) if pd.notna(row.get('Release Side')) else None,
                    'relHeight': float(row['Release Height']) if pd.notna(row.get('Release Height')) else None,
                    'zoneType': 'standard'
                }
                processed_pitches.append(pitch)

            except Exception as e:
                continue

        if not processed_pitches:
            return jsonify({"error": "No valid pitches found in file"}), 400

        return jsonify({
            'pitches': processed_pitches,
            'zoneType': 'standard'
        })

    except Exception as e:
        print(f"Major error processing file: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@app.route('/api/upload/trackman', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)  # Add this decorator
def upload_trackman():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    if 'file' not in request.files:
        response = jsonify({"error": "No file provided"})
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 400
    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    try:
        # Read file based on extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format"}), 400

        # Process each pitch
        processed_pitches = []
        for _, row in df.iterrows():
            pitch = {
                'timestamp': pd.Timestamp.now().isoformat(),
                'type': str(row.get('TaggedPitchType', '')).lower(),
                'velocity': float(row.get('RelSpeed')) if pd.notna(row.get('RelSpeed')) else None,
                'spinRate': float(row.get('SpinRate')) if pd.notna(row.get('SpinRate')) else None,
                'spinAxis': float(row.get('SpinAxis')) if pd.notna(row.get('SpinAxis')) else None,
                'horizontalBreak': float(row.get('HorzBreak')) if pd.notna(row.get('HorzBreak')) else None,
                'verticalBreak': float(row.get('InducedVertBreak')) if pd.notna(row.get('InducedVertBreak')) else None,
                'plateLocHeight': float(row.get('PlateLocHeight')) if pd.notna(row.get('PlateLocHeight')) else None,
                'plateLocSide': float(row.get('PlateLocSide')) if pd.notna(row.get('PlateLocSide')) else None,
                'extension': float(row.get('Extension')) if pd.notna(row.get('Extension')) else None,
                'source': 'trackman',
                'zoneType': 'standard'
            }
            processed_pitches.append(pitch)

        return jsonify({
            'pitches': processed_pitches,
            'playerInfo': {
                'pitcher': df['Pitcher'].iloc[0] if 'Pitcher' in df.columns else None,
                'team': df['PitcherTeam'].iloc[0] if 'PitcherTeam' in df.columns else None
            },
            'zoneType': 'standard'
        })

    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@app.route('/api/upload/d3', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def upload_d3():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    if 'file' not in request.files:
        response = jsonify({"error": "No file provided"})
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    # Get chart type from query params, default to 'game'
    chart_type = request.args.get('chartType', 'game')
    zone_type = request.args.get('zoneType', 'standard')

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format"}), 400

        processed_pitches = []

        if chart_type == 'bullpen':
            for _, row in df.iterrows():
                pitcher_info = {
                    'name': row.get('pitcher', ''),
                    'pitchHand': row.get('pitcherHand', '')
                }

                pitch = {
                    'timestamp': row.get('time', pd.Timestamp.now().isoformat()),
                    'pitcher': pitcher_info,
                    'type': str(row.get('pitchType', '')).lower(),
                    'velocity': float(row['velocity']) if pd.notna(row.get('velocity')) else None,
                    'intendedZone': str(row.get('intendedZone', '')),
                    'x': float(row['pitchX']) if pd.notna(row.get('pitchX')) else None,
                    'y': float(row['pitchY']) if pd.notna(row.get('pitchY')) else None,
                    'note': str(row.get('notes', '-')),
                    'zoneType': zone_type
                }
                processed_pitches.append(pitch)

        else:  # Game format
            for _, row in df.iterrows():
                pitcher_info = {
                    'name': row.get('pitcher', ''),
                    'pitchHand': row.get('pitcherHand', '')
                }

                batter_info = {
                    'name': row.get('batter', ''),
                    'batHand': row.get('batterHand', '')
                }

                hit_details = None
                if pd.notna(row.get('hitX')) and pd.notna(row.get('hitY')):
                    hit_details = {
                        'x': float(row['hitX']),
                        'y': float(row['hitY'])
                    }

                pitch = {
                    'timestamp': row.get('time', pd.Timestamp.now().isoformat()),
                    'pitcher': pitcher_info,
                    'batter': batter_info,
                    'type': str(row.get('pitchType', '')).lower(),
                    'velocity': float(row['velocity']) if pd.notna(row.get('velocity')) else None,
                    'result': str(row.get('result', '')).replace(' ', '_'),
                    'hitResult': str(row.get('hitResult', '')).replace(' ', '_'),
                    'x': float(row['pitchX']) if pd.notna(row.get('pitchX')) else None,
                    'y': float(row['pitchY']) if pd.notna(row.get('pitchY')) else None,
                    'hitDetails': hit_details,
                    'note': str(row.get('notes', '-')),
                    'zoneType': zone_type
                }
                processed_pitches.append(pitch)

        if not processed_pitches:
            return jsonify({"error": "No valid pitches found in file"}), 400

        first_pitch = processed_pitches[0]
        player_info = {
            'pitcher': first_pitch.get('pitcher', {}).get('name'),
            'pitcherHand': first_pitch.get('pitcher', {}).get('pitchHand')
        }

        return jsonify({
            'pitches': processed_pitches,
            'playerInfo': player_info,
            'zoneType': zone_type
        })

    except Exception as e:
        print(f"Error processing D3 file: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@app.route('/api/conferences', methods=['GET'])
def get_conferences():
    conn = get_db_connection()
    cursor = conn.cursor()

    division = request.args.get('division', default=3, type=int)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3"}), 400

    try:
        cursor.execute("""
            SELECT DISTINCT Conference
            FROM (
                SELECT Conference
                FROM batting_war
                WHERE Division = ? AND Season = 2025
                UNION
                SELECT Conference
                FROM pitching_war
                WHERE Division = ? AND Season = 2025
            ) AS combined_conferences
            WHERE Conference IS NOT NULL
            ORDER BY Conference
        """, (division, division))

        conferences = [row[0] for row in cursor.fetchall()]

        if not conferences:
            return jsonify([])

        return jsonify(conferences)

    except Exception as e:
        print(f"Error fetching conferences: {e}")
        return jsonify({"error": "Failed to fetch conferences"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/api/teams/logos/<team_id>.png')
def get_team_logo(team_id):
    try:
        image_path = os.path.join(app.root_path, 'images', f'{team_id}.gif')

        if not os.path.exists(image_path):
            return '', 404

        with Image.open(image_path) as img:
            img = img.convert('RGBA')

            data = img.getdata()
            new_data = []
            for item in data:
                if item[0] > 245 and item[1] > 245 and item[2] > 245:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)

            img.putdata(new_data)

            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)

            return Response(
                img_io.getvalue(),
                mimetype='image/png',
                headers={
                    'Cache-Control': 'public, max-age= 31536000',
                    'Content-Type': 'image/png'
                }
            )

    except Exception as e:
        print(f"Error serving logo: {e}")
        return '', 404


@app.route('/api/players')
def get_players():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            WITH LatestPlayerYear AS (
                SELECT 
                    player_id, 
                    MAX(year) as latest_year
                FROM rosters
                WHERE player_id LIKE 'd3d-%'
                GROUP BY player_id
            )
            SELECT 
                r1.player_id, 
                r1.player_name,
                r2.position,
                r2.team_name,
                r2.conference,
                r2.division,
                MIN(r1.year) as minYear,
                MAX(r1.year) as maxYear,
                JSON_GROUP_ARRAY(DISTINCT r1.year) as years
            FROM rosters r1
            LEFT JOIN (
                SELECT r.player_id, r.team_name, r.conference, r.division, r.year, r.position
                FROM rosters r
                JOIN LatestPlayerYear lpy ON r.player_id = lpy.player_id AND r.year = lpy.latest_year
            ) r2 ON r1.player_id = r2.player_id
            WHERE r1.player_id LIKE 'd3d-%'
            GROUP BY r1.player_id
            ORDER BY r1.player_name
        """)

        players = []
        for row in cursor.fetchall():
            player_dict = dict(row)

            # Capitalize the position field
            if player_dict.get('position'):
                player_dict['position'] = player_dict['position'].upper()

            # Parse the years JSON array
            try:
                if isinstance(player_dict.get('years'), str):
                    import json
                    player_dict['years'] = json.loads(player_dict['years'])
            except:
                # Fallback if JSON parsing fails
                player_dict['years'] = [
                    player_dict['minYear'], player_dict['maxYear']]

            players.append(player_dict)

        return jsonify(players)

    except Exception as e:
        print(f"Error fetching players: {e}")
        return jsonify({"error": f"Failed to fetch players: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/api/conferences/logos/<conference_id>.png')
def get_conference_logo(conference_id):
    try:
        image_path = os.path.join(
            app.root_path, 'images', f'{conference_id}.gif')

        if not os.path.exists(image_path):
            return '', 404

        with Image.open(image_path) as img:
            img = img.convert('RGBA')

            data = img.getdata()
            new_data = []
            for item in data:
                if item[0] > 245 and item[1] > 245 and item[2] > 245:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)

            img.putdata(new_data)

            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)

            return Response(
                img_io.getvalue(),
                mimetype='image/png',
                headers={
                    'Cache-Control': 'public, max-age= 31536000',
                    'Content-Type': 'image/png'
                }
            )

    except Exception as e:
        print(f"Error serving conference logo: {e}")
        return '', 404


@app.route('/api/similar-batters/<string:player_id>', methods=['GET'])
def get_similar_batters(player_id):
    year = request.args.get('year', type=int, default=2025)
    division = request.args.get('division', type=int, default=3)
    count = request.args.get('count', type=int, default=5)

    if year < 2021 or year > 2025:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2025."}), 400

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Get target player data - direct query with indices
        cursor.execute("""
            SELECT 
                bb.*,
                b.WAR,
                b.GP,
                (b.WAR / CASE WHEN b.PA = 0 THEN 1 ELSE b.PA END) as WAR_per_PA,
                b.Player as player_name,
                b.Team as team_name,
                b.[K%],
                b.[BB%]
            FROM batted_ball bb
            JOIN batting_war b ON bb.batter_id = b.player_id AND bb.year = b.Season AND bb.division = b.Division
            WHERE bb.batter_id = ? AND bb.year = ? AND bb.division = ?
        """, (player_id, year, division))

        target_player = cursor.fetchone()

        if not target_player:
            return jsonify({"error": "Player not found or no data available"}), 404

        target_data = dict(target_player)
        target_name = target_data.get('player_name', "Unknown Player")

        # Run a single optimized query with calculated similarity scores
        # This avoids fetching all players and calculating in Python
        cursor.execute("""
            WITH target_metrics AS (
                SELECT 
                    gb_pct, fb_pct, ld_pct, 
                    (WAR / CASE WHEN PA = 0 THEN 1 ELSE PA END) as WAR_per_PA,
                    [K%], [BB%],
                    WAR
                FROM (
                    SELECT 
                        bb.*,
                        b.WAR,
                        b.[K%],
                        b.[BB%],
                        b.GP
                    FROM batted_ball bb
                    JOIN batting_war b ON bb.batter_id = b.player_id 
                        AND bb.year = b.Season 
                        AND bb.division = b.Division
                    WHERE bb.batter_id = ? AND bb.year = ? AND bb.division = ?
                )
            ),
            similar_players AS (
                SELECT 
                    bb.*,
                    b.WAR, 
                    b.GP,
                    (b.WAR / CASE WHEN b.PA = 0 THEN 1 ELSE PA END) as WAR_per_PA,
                    b.[K%],
                    b.[BB%],
                    b.Player, 
                    b.Team,
                    b.Season as year,
                    i.prev_team_id,
                    i.conference_id,
                    (
                        (4 * POWER((bb.gb_pct - (SELECT gb_pct FROM target_metrics)), 2) + 
                        4 * POWER((bb.fb_pct - (SELECT fb_pct FROM target_metrics)), 2) + 
                        4 * POWER((bb.ld_pct - (SELECT ld_pct FROM target_metrics)), 2) + 
                        4 * POWER((b.[K%] - (SELECT [K%] FROM target_metrics)), 2) + 
                        4 * POWER((b.[BB%] - (SELECT [BB%] FROM target_metrics)), 2) + 
                        5 * POWER(
                             ((b.WAR / CASE WHEN b.GP = 0 THEN 1 ELSE b.GP END) - 
                             (SELECT WAR_per_PA FROM target_metrics)), 2)
                        ) / (4 + 4 + 4 + 4 + 4 + 5)
                    ) as distance_score
                FROM batted_ball bb
                JOIN batting_war b ON bb.batter_id = b.player_id 
                    AND bb.year = b.Season 
                    AND bb.division = b.Division
                LEFT JOIN ids_for_images i ON bb.bat_team = i.team_name
                WHERE bb.division = ? AND (bb.batter_id != ? OR bb.year != ?)
                ORDER BY distance_score ASC
                LIMIT 50
            )
            SELECT 
                batter_id as player_id,
                Player as player_name,
                Team as team,
                year,
                ROUND(MAX(0, 100 - (distance_score * 15))) as similarity_score,
                ROUND(WAR, 1) as war,
                ROUND(WAR_per_PA, 3) as war_per_PA,
                prev_team_id,
                conference_id
            FROM similar_players
            GROUP BY batter_id
            ORDER BY similarity_score DESC
            LIMIT ?
        """, (player_id, year, division, division, player_id, year, count))

        similar_players = [dict(row) for row in cursor.fetchall()]

        return jsonify({
            'target_player': {
                'player_id': player_id,
                'player_name': target_name,
                'year': year
            },
            'similar_players': similar_players
        })

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/api/leaderboards/value', methods=['GET'])
@require_premium
def get_value_leaderboard():
    start_year = request.args.get('start_year', '2025')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)

        if not (2021 <= start_year <= 2025) or not (2021 <= end_year <= 2025) or start_year > end_year:
            return jsonify({"error": "Invalid year range"}), 400
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    results = []

    try:
        for year in range(start_year, end_year + 1):
            # Fetch batting data
            cursor.execute("""
                SELECT
                    b.Player, b.Team, b.Conference, b.Pos, b.PA,
                    b.Batting, b.Adjustment, b.Baserunning, b.WAR AS bWAR, b.Division,
                    i.prev_team_id, i.conference_id, b.player_id, b.WPA, b.[WPA/LI], b.REA, b.Clutch
                FROM batting_war b
                LEFT JOIN ids_for_images i ON b.Team = i.team_name
                WHERE Division = ? AND Season = ?

            """, (division, year))
            batting_data = {(row['Player'], row['Team']): dict(row)
                            for row in cursor.fetchall()}

            # Fetch pitching data
            cursor.execute("""
                SELECT
                    p.Player, p.Team, p.Conference, 'P' AS Pos, p.IP,
                    p.WAR AS pWAR, p.Division,
                    i.prev_team_id, i.conference_id, p.player_id, p.pWPA, p.[pWPA/LI], p.pREA, p.Clutch
                FROM pitching_war p
                LEFT JOIN ids_for_images i ON p.Team = i.team_name
                WHERE Division = ? AND Season = ?
            """, (division, year))
            pitching_data = {(row['Player'], row['Team']): dict(row)
                             for row in cursor.fetchall()}

            # Combine batting and pitching data
            all_players = set(batting_data.keys()) | set(pitching_data.keys())

            for player, team in all_players:
                bat_stats = batting_data.get((player, team), {})
                pitch_stats = pitching_data.get((player, team), {})

                combined_stats = {
                    'Player': player,
                    'Team': team,
                    'Division': bat_stats.get('Division') or pitch_stats.get('Division'),
                    'player_id': bat_stats.get('player_id') or pitch_stats.get('player_id'),
                    'Conference': bat_stats.get('Conference') or pitch_stats.get('Conference') or '-',
                    'prev_team_id': bat_stats.get('prev_team_id') or pitch_stats.get('prev_team_id'),
                    'conference_id': bat_stats.get('conference_id') or pitch_stats.get('conference_id'),
                    'Year': year,
                    'Pos': bat_stats.get('Pos', '-') if 'Pos' in bat_stats else pitch_stats.get('Pos', '-'),
                    'PA': bat_stats.get('PA', 0),
                    'IP': pitch_stats.get('IP', 0),
                    'Batting': bat_stats.get('Batting', 0),
                    'Adjustment': bat_stats.get('Adjustment', 0),
                    'Baserunning': bat_stats.get('Baserunning', 0),
                    'bWAR': bat_stats.get('bWAR', 0),
                    'pWAR': pitch_stats.get('pWAR', 0),
                    'bREA': bat_stats.get('REA', 0),
                    'pREA': pitch_stats.get('pREA', 0),
                    'pWPA/LI': pitch_stats.get('pWPA/LI', 0),
                    'bWPA/LI': bat_stats.get('WPA/LI', 0),
                    'pWPA': pitch_stats.get('pWPA', 0),
                    'bWPA': bat_stats.get('WPA', 0),
                    'bClutch': bat_stats.get('Clutch', 0),
                    'pClutch': bat_stats.get('pClutch', 0),
                }

                combined_stats['WAR'] = round(
                    (combined_stats['bWAR'] or 0) + (combined_stats['pWAR'] or 0), 1)

                combined_stats['WPA'] = round(
                    (combined_stats['bWPA'] or 0) + (combined_stats['pWPA'] or 0), 1)

                combined_stats['WPA/LI'] = round(
                    (combined_stats['bWPA/LI'] or 0) + (combined_stats['pWPA/LI'] or 0), 1)

                combined_stats['Clutch'] = round(
                    (combined_stats['bClutch'] or 0) + (combined_stats['pClutch'] or 0), 1)

                combined_stats['REA'] = round(
                    (combined_stats['bREA'] or 0) + (combined_stats['pREA'] or 0), 1)

                results.append(combined_stats)

        results.sort(key=lambda x: x['WAR'], reverse=True)
        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/api/leaderboards/baserunning', methods=['GET'])
@app.route('/api/leaderboards/baserunning/<string:player_id>', methods=['GET'])
def get_player_baserunning(player_id=None):
    start_year = request.args.get('start_year', '2021')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)
    limit = request.args.get('limit', type=int, default=100)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < 2021 or end_year > 2025 or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    results = []

    try:
        for year in range(start_year, end_year + 1):
            query = """
                WITH baserunning_query AS (
                    SELECT DISTINCT
                        b.Player,
                        b.player_id,
                        b.Team,
                        b.Conference,
                        i.prev_team_id,
                        i.conference_id,
                        b.Baserunning,
                        b.wSB,
                        b.wGDP,
                        b.wTEB,
                        b.Picked,
                        b.SB,
                        b.CS,
                        b.[SB%],
                        b.Opportunities,
                        b.OutsOB,
                        b.EBT AS XBT,
                        b.Year,
                        b.Division
                    FROM baserunning b
                    LEFT JOIN ids_for_images i
                        ON b.Team = i.team_name
                    WHERE b.Division = ? AND b.Year = ?
                    {0}
                    ORDER BY b.Baserunning DESC
                    {1}
                )
                SELECT * FROM baserunning_query
            """

            if player_id:
                where_clause = "AND b.player_id = ?"
                limit_clause = ""
                params = (division, year, player_id)
            else:
                where_clause = ""
                limit_clause = "LIMIT ?"
                params = (division, year, limit)

            formatted_query = query.format(where_clause, limit_clause)
            cursor.execute(formatted_query, params)

            columns = [col[0] for col in cursor.description]
            year_results = [dict(zip(columns, row))
                            for row in cursor.fetchall()]
            results.extend(year_results)

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/leaderboards/situational', methods=['GET'])
@app.route('/api/leaderboards/situational/<string:player_id>', methods=['GET'])
def get_player_situational(player_id=None):
    start_year = request.args.get('start_year', '2021')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)
    limit = request.args.get('limit', type=int, default=100)

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < 2021 or end_year > 2025 or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    results = []

    try:
        for year in range(start_year, end_year + 1):
            query = """
                WITH situational_query AS (
                    SELECT DISTINCT
                        p.Player,
                        p.Team,
                        p.Season,
                        p.Conference,
                        p.player_id,
                        i.prev_team_id,
                        i.conference_id,
                        s.Division,
                        s.wOBA_Overall,
                        s.wOBA_RISP,
                        s.wOBA_High_Leverage,
                        s.wOBA_Low_Leverage,
                        s.PA_Overall,
                        s.PA_RISP,
                        s.PA_High_Leverage,
                        s.PA_Low_Leverage,
                        s.BA_Overall,
                        s.BA_High_Leverage,
                        s.BA_Low_Leverage,
                        s.BA_RISP,
                        s.RE24_Overall,
                        s.RE24_High_Leverage,
                        s.RE24_Low_Leverage,
                        s.RE24_RISP,
                        p.Clutch,
                        p.WPA,
                        p.[WPA/LI],
                        p.REA
                    FROM situational s
                    JOIN batting_war p
                        ON s.batter_standardized = p.Player
                        AND s.bat_team = p.Team
                        AND s.year = p.Season
                        AND s.division = p.Division
                    LEFT JOIN ids_for_images i
                        ON p.Team = i.team_name
                    WHERE p.Division = ?
                        AND p.Season = ?
                        {0}
                    ORDER BY s.wOBA_Overall DESC
                    {1}
                )
                SELECT * FROM situational_query
            """

            if player_id:
                where_clause = "AND p.player_id = ?"
                limit_clause = ""
                params = (division, year, player_id)
            else:
                where_clause = ""
                limit_clause = "LIMIT ?"
                params = (division, year, limit)

            formatted_query = query.format(where_clause, limit_clause)
            cursor.execute(formatted_query, params)

            columns = [col[0] for col in cursor.description]
            year_results = [dict(zip(columns, row))
                            for row in cursor.fetchall()]
            results.extend(year_results)

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/leaderboards/situational_pitcher', methods=['GET'])
@app.route('/api/leaderboards/situational_pitcher/<string:player_id>', methods=['GET'])
def get_player_situational_pitcher(player_id=None):
    start_year = request.args.get('start_year', '2021')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)
    limit = request.args.get('limit', type=int, default=100)

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < 2021 or end_year > 2025 or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    results = []

    try:
        for year in range(start_year, end_year + 1):
            query = """
                WITH situational_query AS (
                    SELECT DISTINCT
                        p.Player,
                        p.Team,
                        p.Season,
                        p.Conference,
                        p.player_id,
                        i.prev_team_id,
                        i.conference_id,
                        s.Division,
                        s.wOBA_Overall,
                        s.wOBA_RISP,
                        s.wOBA_High_Leverage,
                        s.wOBA_Low_Leverage,
                        s.PA_Overall,
                        s.PA_RISP,
                        s.PA_High_Leverage,
                        s.PA_Low_Leverage,
                        s.BA_Overall,
                        s.BA_High_Leverage,
                        s.BA_Low_Leverage,
                        s.BA_RISP,
                        s.RE24_Overall,
                        s.RE24_High_Leverage,
                        s.RE24_Low_Leverage,
                        s.RE24_RISP,
                        p.Clutch,
                        p.pWPA,
                        p.[pWPA/LI],
                        p.pREA
                    FROM situational_pitcher s
                    JOIN pitching_war p
                        ON s.pitcher_standardized = p.Player
                        AND s.pitch_team = p.Team
                        AND s.year = p.Season
                        AND s.division = p.Division
                    LEFT JOIN ids_for_images i
                        ON p.Team = i.team_name
                    WHERE p.Division = ?
                        AND p.Season = ?
                        {0}
                    ORDER BY s.wOBA_Overall ASC
                    {1}
                )
                SELECT * FROM situational_query
            """

            if player_id:
                where_clause = "AND p.player_id = ?"
                limit_clause = ""
                params = (division, year, player_id)
            else:
                where_clause = ""
                limit_clause = "LIMIT ?"
                params = (division, year, limit)

            formatted_query = query.format(where_clause, limit_clause)
            cursor.execute(formatted_query, params)

            columns = [col[0] for col in cursor.description]
            year_results = [dict(zip(columns, row))
                            for row in cursor.fetchall()]
            results.extend(year_results)

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/leaderboards/splits', methods=['GET'])
@app.route('/api/leaderboards/splits/<string:player_id>', methods=['GET'])
def get_player_splits(player_id=None):
    start_year = request.args.get('start_year', '2021')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)
    limit = request.args.get('limit', type=int, default=100)

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < 2021 or end_year > 2025 or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    results = []

    try:
        for year in range(start_year, end_year + 1):
            query = """
                WITH splits_query AS (
                    SELECT DISTINCT
                        p.Player,
                        p.Team,
                        p.Season,
                        p.Conference,
                        p.player_id,
                        i.prev_team_id,
                        i.conference_id,
                        s.Division,
                        -- Overall Stats
                        s.[PA_Overall] as 'PA_Overall',
                        s.[BA_Overall] as 'BA_Overall',
                        s.[OBP_Overall] as 'OBP_Overall',
                        s.[SLG_Overall] as 'SLG_Overall',
                        s.[wOBA_Overall] as 'wOBA_Overall',
                        -- vs RHP Stats
                        s.[PA_vs RHP] as 'PA_vs RHP',
                        s.[BA_vs RHP] as 'BA_vs RHP',
                        s.[OBP_vs RHP] as 'OBP_vs RHP',
                        s.[SLG_vs RHP] as 'SLG_vs RHP',
                        s.[wOBA_vs RHP] as 'wOBA_vs RHP',
                        -- vs LHP Stats
                        s.[PA_vs LHP] as 'PA_vs LHP',
                        s.[BA_vs LHP] as 'BA_vs LHP',
                        s.[OBP_vs LHP] as 'OBP_vs LHP',
                        s.[SLG_vs LHP] as 'SLG_vs LHP',
                        s.[wOBA_vs LHP] as 'wOBA_vs LHP'
                    FROM splits s
                    JOIN batting_war p
                        ON s.batter_standardized = p.Player
                        AND s.bat_team = p.Team
                        AND s.Year = p.Season
                        AND s.Division = p.Division
                    LEFT JOIN ids_for_images i
                        ON p.Team = i.team_name
                    WHERE p.Division = ?
                        AND p.Season = ?
                        {0}
                    ORDER BY s.[wOBA_Overall] DESC
                    {1}
                )
                SELECT * FROM splits_query
            """

            if player_id:
                where_clause = "AND p.player_id = ?"
                limit_clause = ""
                params = (division, year, player_id)
            else:
                where_clause = ""
                limit_clause = "LIMIT ?"
                params = (division, year, limit)

            formatted_query = query.format(where_clause, limit_clause)
            cursor.execute(formatted_query, params)

            columns = [col[0] for col in cursor.description]
            year_results = [dict(zip(columns, row))
                            for row in cursor.fetchall()]
            results.extend(year_results)

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/leaderboards/splits_pitcher', methods=['GET'])
@app.route('/api/leaderboards/splits_pitcher/<string:player_id>', methods=['GET'])
def get_player_splits_pitcher(player_id=None):
    start_year = request.args.get('start_year', '2021')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)
    limit = request.args.get('limit', type=int, default=100)

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < 2021 or end_year > 2025 or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    results = []

    try:
        for year in range(start_year, end_year + 1):
            query = """
                WITH splits_query AS (
                    SELECT DISTINCT
                        p.Player,
                        p.Team,
                        p.Season,
                        p.Conference,
                        p.player_id,
                        i.prev_team_id,
                        i.conference_id,
                        s.Division,
                        -- Overall Stats
                        s.[PA_Overall] as 'PA_Overall',
                        s.[BA_Overall] as 'BA_Overall',
                        s.[OBP_Overall] as 'OBP_Overall',
                        s.[SLG_Overall] as 'SLG_Overall',
                        s.[wOBA_Overall] as 'wOBA_Overall',
                        -- vs RHH Stats
                        s.[PA_vs RHH] as 'PA_vs RHH',
                        s.[BA_vs RHH] as 'BA_vs RHH',
                        s.[OBP_vs RHH] as 'OBP_vs RHH',
                        s.[SLG_vs RHH] as 'SLG_vs RHH',
                        s.[wOBA_vs RHH] as 'wOBA_vs RHH',
                        -- vs LHH Stats
                        s.[PA_vs LHH] as 'PA_vs LHH',
                        s.[BA_vs LHH] as 'BA_vs LHH',
                        s.[OBP_vs LHH] as 'OBP_vs LHH',
                        s.[SLG_vs LHH] as 'SLG_vs LHH',
                        s.[wOBA_vs LHH] as 'wOBA_vs LHH'
                    FROM splits_pitcher s
                    JOIN pitching_war p
                        ON s.pitcher_standardized = p.Player
                        AND s.pitch_team = p.Team
                        AND s.Year = p.Season
                        AND s.Division = p.Division
                    LEFT JOIN ids_for_images i
                        ON p.Team = i.team_name
                    WHERE p.Division = ?
                        AND p.Season = ?
                        {0}
                    ORDER BY s.[wOBA_Overall] ASC
                    {1}
                )
                SELECT * FROM splits_query
            """

            if player_id:
                where_clause = "AND p.player_id = ?"
                limit_clause = ""
                params = (division, year, player_id)
            else:
                where_clause = ""
                limit_clause = "LIMIT ?"
                params = (division, year, limit)

            formatted_query = query.format(where_clause, limit_clause)
            cursor.execute(formatted_query, params)

            columns = [col[0] for col in cursor.description]
            year_results = [dict(zip(columns, row))
                            for row in cursor.fetchall()]
            results.extend(year_results)

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/leaderboards/batted_ball', methods=['GET'])
@app.route('/api/leaderboards/batted_ball/<string:player_id>', methods=['GET'])
def get_player_batted_ball(player_id=None):
    start_year = request.args.get('start_year', '2021')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)
    limit = request.args.get('limit', type=int, default=100)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < 2021 or end_year > 2025 or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    results = []

    try:
        for year in range(start_year, end_year + 1):
            query = """
                WITH battedball_query AS (
                    SELECT DISTINCT
                        p.Player,
                        p.Team,
                        p.Season,
                        p.Conference,
                        p.player_id,
                        i.prev_team_id,
                        i.conference_id,
                        bb.Division,
                        bb.count,
                        bb.batter_hand,
                        bb.pull_pct,
                        bb.oppo_pct,
                        bb.middle_pct,
                        bb.gb_pct,
                        bb.fb_pct,
                        bb.ld_pct,
                        bb.pop_pct,
                        bb.pull_air_pct,
                        bb.oppo_gb_pct
                    FROM batted_ball bb
                    JOIN batting_war p
                        ON bb.batter_standardized = p.Player
                        AND bb.bat_team = p.Team
                        AND bb.year = p.Season
                        AND bb.Division = p.Division
                    LEFT JOIN ids_for_images i
                        ON p.Team = i.team_name
                    WHERE p.Division = ?
                        AND p.Season = ?
                        {0}
                    ORDER BY bb.count DESC
                    {1}
                )
                SELECT * FROM battedball_query
            """

            if player_id:
                where_clause = "AND p.player_id = ?"
                limit_clause = ""
                params = (division, year, player_id)
            else:
                where_clause = ""
                limit_clause = "LIMIT ?"
                params = (division, year, limit)

            formatted_query = query.format(where_clause, limit_clause)
            cursor.execute(formatted_query, params)

            columns = [col[0] for col in cursor.description]
            year_results = [dict(zip(columns, row))
                            for row in cursor.fetchall()]
            results.extend(year_results)

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/games/<int:year>/<game_id>', methods=['GET'])
@require_premium
def get_game(year, game_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT
            p.home_team, p.away_team, p.home_score, p.away_score, p.date as game_date,
            p.inning, p.top_inning, p.game_id, p.description,
            p.home_win_exp_before, p.home_win_exp_after, p.wpa, p.run_expectancy_delta,
            p.batter_id, p.pitcher_id,
            p.li, p.home_score_after, p.away_score_after,
            r_batter.player_name as batter_name,
            r_pitcher.player_name as pitcher_name, p.woba, p.division
        FROM pbp p
        LEFT JOIN rosters r_batter
            ON p.batter_id = r_batter.player_id
            AND p.year = r_batter.year
            AND p.division = r_batter.division
        LEFT JOIN rosters r_pitcher
            ON p.pitcher_id = r_pitcher.player_id
            AND p.year = r_pitcher.year
            AND p.division = r_pitcher.division
        WHERE p.game_id = ?
        AND p.year = ?
        ORDER BY p.play_id
    """, (game_id, year))

    plays = [dict(row) for row in cursor.fetchall()]

    if not plays:
        return jsonify({"error": "Game not found"}), 404

    game_info = {
        'home_team': plays[0]['home_team'],
        'away_team': plays[0]['away_team'],
        'game_date': plays[0]['game_date'],
        'game_id': plays[0]['game_id'],
        'division': plays[0]['division'],
        'plays': plays
    }

    conn.close()
    return jsonify(game_info)


@app.route('/api/games', methods=['GET'])
@require_premium
def get_games_by_date():
    month = request.args.get('month')
    day = request.args.get('day')
    year = request.args.get('year')
    division = request.args.get('division', 3)

    if not month or not day or not year:
        return jsonify({"error": "Missing required query parameters: month, day, year"}), 400

    try:
        year = int(year)

        if year < 2021:
            return jsonify({"error": f"No games available for year {year}. Please select a year between 2021 and 2025"}), 400

        game_date = f"{month}/{day}/{year}"

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(f"""
            SELECT DISTINCT
                p.game_id,
                p.year,
                p.home_team,
                p.away_team,
                MAX(p.home_score_after) as home_score,
                MAX(p.away_score_after) as away_score,
                p.date as game_date,
                i_home.prev_team_id as home_team_logo_id,
                i_away.prev_team_id as away_team_logo_id
            FROM pbp p
            LEFT JOIN ids_for_images i_home
                ON p.home_team = i_home.team_name
            LEFT JOIN ids_for_images i_away
                ON p.away_team = i_away.team_name
            WHERE p.date = ? AND p.division = ?
            GROUP BY p.game_id, p.home_team, p.away_team, p.date
        """, (game_date, division))

        games = [dict(row) for row in cursor.fetchall()]
        conn.close()

        if not games:
            return jsonify({"games": [], "message": f"No games found for date {game_date}"}), 200

        return jsonify(games)

    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/insights/query', methods=['POST'])
def query_insights():
    try:
        insights_processor = InsightsProcessor()
        data = request.get_json()
        question = data['question'].strip()
        conversation_id = data.get('conversation_id', str(uuid.uuid4()))

        if len(question) > 1000:
            return jsonify({
                "status": "error",
                "message": "Question too long",
                "data": None
            }), 400

        # Process the question with conversation context
        result = insights_processor.process_question(question, conversation_id)

        # Ensure result has the expected structure
        formatted_result = {
            "answer": result["result"]["answer"],
            "analysis": result["result"]["analysis"],
            "data": result["result"]["data"]  # SQL query results if any
        }

        return jsonify({
            "status": "success",
            "result": formatted_result,
            "conversation_id": conversation_id
        }), 200

    except Exception as e:
        logger.error(f"Error processing question: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e),
            "data": None
        }), 500


class StripeService:
    def __init__(self, db: firestore.Client):
        self.db = db
        self.webhook_secret = STRIPE_WEBHOOK

    def _get_plan_type(self, price_id: Optional[str]) -> str:
        """Determine the plan type based on price ID"""
        if not price_id:
            return 'monthly'
        try:
            price = stripe.Price.retrieve(price_id)
            return 'yearly' if price.id == 'price_1QQjEeIb7aERwB58FkccirOh' else 'monthly'
        except stripe.error.StripeError:
            return 'monthly'

    def _update_subscription_data(self, user_id: str, data: Dict) -> None:
        """Update subscription data in Firestore with merge"""
        try:
            subscription_ref = self.db.collection(
                'subscriptions').document(user_id)
            subscription_ref.set({
                'updatedAt': datetime.now(),
                **data
            }, merge=True)
        except Exception as e:
            logger.error(f"Error updating subscription data: {str(e)}")
            raise

    def handle_checkout_completed(self, session: Dict) -> None:
        """Handle successful checkout completion"""
        try:
            # Add detailed logging
            logger.info(
                f"Processing session with data: {json.dumps(session, default=str)}")

            customer_id = session.get('customer')
            subscription_id = session.get('subscription')
            user_id = session.get('client_reference_id')

            if not user_id:
                logger.error(
                    "No client_reference_id found in checkout session")
                return

            if not subscription_id:
                # For testing, we might want to get the subscription from line items
                logger.info("Attempting to find subscription in line items...")
                # Add more detailed subscription lookup here

            subscription = stripe.Subscription.retrieve(subscription_id)
            price_id = subscription.items.data[0].price.id
            plan_type = self._get_plan_type(price_id)

            self._update_subscription_data(user_id, {
                'status': 'active',
                'stripeCustomerId': customer_id,
                'stripeSubscriptionId': subscription_id,
                'planType': plan_type,
                'createdAt': datetime.now(),
                'expiresAt': datetime.fromtimestamp(subscription.current_period_end),
                'cancelAtPeriodEnd': subscription.cancel_at_period_end
            })

        except Exception as e:
            logger.error(f"Error handling checkout completion: {str(e)}")
            raise

    def _handle_subscription_status_change(self, subscription: Dict, status: str) -> None:
        """Handle subscription status changes"""
        try:
            customer_id = subscription.get('customer')
            subscription_id = subscription.get('id')
            current_period_end = subscription.get('current_period_end')

            if not customer_id:
                logger.error("No customer ID found in subscription")
                return

            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]
            user_id = user_doc.id

            update_data = {
                'status': status,
                'expiresAt': datetime.fromtimestamp(current_period_end) if current_period_end else None,
                'stripeSubscriptionId': subscription_id,
                'cancelAtPeriodEnd': subscription.get('cancel_at_period_end', False)
            }

            if status == 'cancelled':
                update_data['canceledAt'] = datetime.now()

            self._update_subscription_data(user_id, update_data)

        except Exception as e:
            logger.error(
                f"Error handling subscription status change: {str(e)}")
            raise

    def handle_subscription_updated(self, subscription: Dict) -> None:
        """Handle subscription update events"""
        status = subscription.get('status', 'active')
        self._handle_subscription_status_change(subscription, status)

    def handle_subscription_deleted(self, subscription: Dict) -> None:
        """Handle subscription deletion events"""
        self._handle_subscription_status_change(subscription, 'cancelled')

    def handle_payment_status_change(self, invoice: Dict, status: str) -> None:
        """Handle payment status changes"""
        try:
            customer_id = invoice.get('customer')
            subscription_id = invoice.get('subscription')

            if not subscription_id:
                return

            if not customer_id:
                logger.error("No customer ID found in invoice")
                return

            users_ref = self.db.collection('subscriptions')
            query = users_ref.where(
                'stripeCustomerId', '==', customer_id).limit(1)
            docs = query.get()

            if not docs:
                logger.error(f"No user found for customer ID: {customer_id}")
                return

            user_doc = docs[0]
            user_id = user_doc.id

            update_data = {
                'lastPaymentStatus': status,
                'lastPaymentDate': datetime.now()
            }

            if status == 'failed':
                update_data['lastPaymentFailure'] = datetime.now()

            self._update_subscription_data(user_id, update_data)

        except Exception as e:
            logger.error(f"Error handling payment status change: {str(e)}")
            raise

    def handle_payment_succeeded(self, invoice: Dict) -> None:
        """Handle successful payment events"""
        self.handle_payment_status_change(invoice, 'succeeded')

    def handle_payment_failed(self, invoice: Dict) -> None:
        """Handle failed payment events"""
        self.handle_payment_status_change(invoice, 'failed')


@app.route('/api/stripe-webhook', methods=['POST'])
def stripe_webhook():
    db = firestore.client()
    stripe_service = StripeService(db)

    # Get the raw request data and signature
    payload = request.get_data()
    sig_header = request.headers.get('stripe-signature')

    if not sig_header:
        logger.error("No Stripe signature header found")
        return jsonify({'error': 'No signature header'}), 400

    try:
        # Verify the webhook signature
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=STRIPE_WEBHOOK
        )

        # Log the event details before processing
        logger.info(
            f"Processing Stripe webhook event: {event.type} | ID: {event.id}")

        event_handlers = {
            'checkout.session.completed': lambda obj: handle_checkout_session_completed(obj, stripe_service),
            'customer.subscription.updated': lambda obj: handle_subscription_updated(obj, stripe_service),
            'customer.subscription.created': lambda obj: handle_subscription_created(obj, stripe_service),
            'invoice.payment_succeeded': lambda obj: handle_payment_succeeded(obj, stripe_service),
            'invoice.payment_failed': lambda obj: handle_payment_failed(obj, stripe_service)
        }

        if event.type in event_handlers:
            try:
                # Execute the appropriate handler with detailed logging
                logger.info(f"Starting to process event {event.type}")
                event_handlers[event.type](event.data.object)
                logger.info(f"Successfully processed {event.type} event")
                return jsonify({'success': True})
            except Exception as e:
                logger.error(
                    f"Error processing {event.type} event: {str(e)}", exc_info=True)
                # Return 200 even on processing error to prevent Stripe retries
                return jsonify({'success': False, 'error': str(e)}), 200
        else:
            logger.info(f"Received unhandled event type: {event.type}")
            return jsonify({'success': True})

    except stripe.error.SignatureVerificationError as e:
        logger.error(f"⚠️ Webhook signature verification failed: {str(e)}")
        return jsonify({'error': 'Invalid signature'}), 400
    except Exception as e:
        logger.error(f"⚠️ Unexpected webhook error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/cancel-subscription', methods=['POST'])
def cancel_subscription():
    try:
        data = request.get_json()
        subscription_id = data.get('subscriptionId')

        if not subscription_id:
            return jsonify({'error': 'Subscription ID is required'}), 400

        stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True
        )

        return jsonify({'success': True})

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error while cancelling subscription: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/subscription/<user_id>', methods=['GET'])
def get_stripe_subscription(user_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Authentication required"}), 401

    try:
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        authorized_user_id = decoded_token['uid']

        if authorized_user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        db = firestore.client()
        sub_doc = db.collection('subscriptions').document(user_id).get()

        stripe_customer_id = None
        stripe_subscription_id = None

        if sub_doc.exists:
            data = sub_doc.to_dict()
            stripe_customer_id = data.get('stripeCustomerId')
            stripe_subscription_id = data.get('stripeSubscriptionId')

        if stripe_subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(
                    stripe_subscription_id)
                return jsonify({"subscription": subscription})
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error retrieving subscription: {str(e)}")

        if stripe_customer_id:
            try:
                subscriptions = stripe.Subscription.list(
                    customer=stripe_customer_id,
                    status='active',
                    limit=1
                )

                if subscriptions and len(subscriptions.data) > 0:
                    return jsonify({"subscription": subscriptions.data[0]})
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error listing subscriptions: {str(e)}")

        try:
            user = auth.get_user(user_id)
            user_email = user.email

            if user_email:
                customers = stripe.Customer.list(email=user_email, limit=1)

                if customers and len(customers.data) > 0:
                    customer = customers.data[0]

                    if sub_doc.exists:
                        db.collection('subscriptions').document(user_id).set({
                            'stripeCustomerId': customer.id,
                            'updatedAt': datetime.now()
                        }, merge=True)

                    subscriptions = stripe.Subscription.list(
                        customer=customer.id,
                        status='active',
                        limit=1
                    )

                    if subscriptions and len(subscriptions.data) > 0:
                        db.collection('subscriptions').document(user_id).set({
                            'stripeSubscriptionId': subscriptions.data[0].id,
                            'updatedAt': datetime.now()
                        }, merge=True)

                        return jsonify({"subscription": subscriptions.data[0]})
        except Exception as e:
            logger.error(
                f"Error in customer/subscription lookup: {str(e)}", exc_info=True)

        return jsonify({"subscription": None})

    except Exception as e:
        logger.error(
            f"Error retrieving Stripe subscription: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        plan_type = data.get('planType')
        email = data.get('email')

        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        price_id = 'price_1QQjEeIb7aERwB58FkccirOh' if plan_type == 'yearly' else 'price_1QQjCoIb7aERwB58JFcQWshS'

        logger.info(
            f"Creating checkout session for plan type: {plan_type} with price ID: {price_id}")

        session = stripe.checkout.Session.create(
            client_reference_id=user_id,
            customer_email=email,
            payment_method_types=['card'],
            mode='subscription',
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            success_url='https://d3-dashboard.com/subscriptions?status=success',
            cancel_url='https://d3-dashboard.com/subscriptions?status=canceled',
        )

        logger.info(f"Created checkout session with URL: {session.url}")

        return jsonify({'url': session.url})

    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        return jsonify({'error': str(e)}), 500


def handle_checkout_session_completed(session, stripe_service):
    """Handle checkout.session.completed event with detailed logging"""
    logger.info(f"Processing checkout session: {session.id}")
    try:
        if not session.client_reference_id:
            logger.error("No client_reference_id in checkout session")
            return jsonify({'success': False, 'error': 'Missing client_reference_id'}), 200

        if not session.subscription:
            logger.error("No subscription ID in checkout session")
            return jsonify({'success': False, 'error': 'Missing subscription ID'}), 200

        stripe_service.handle_checkout_completed(session)
        logger.info(f"Successfully processed checkout session {session.id}")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error in checkout completion: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 200


def handle_subscription_created(subscription, stripe_service):
    """Handle customer.subscription.created event"""
    logger.info(f"Processing subscription created: {subscription.id}")
    try:
        if not subscription.customer:
            logger.error("No customer ID in subscription")
            raise ValueError("Missing customer ID")

        stripe_service.handle_subscription_updated(subscription)
        logger.info(
            f"Successfully processed subscription creation {subscription.id}")
    except Exception as e:
        logger.error(
            f"Error in subscription creation: {str(e)}", exc_info=True)
        raise


def handle_subscription_updated(subscription, stripe_service):
    """Handle customer.subscription.updated event"""
    logger.info(f"Processing subscription update: {subscription.id}")
    try:
        stripe_service.handle_subscription_updated(subscription)
        logger.info(
            f"Successfully processed subscription update {subscription.id}")
    except Exception as e:
        logger.error(f"Error in subscription update: {str(e)}", exc_info=True)
        raise


def handle_payment_succeeded(invoice, stripe_service):
    """Handle invoice.payment_succeeded event"""
    logger.info(f"Processing successful payment: {invoice.id}")
    try:
        stripe_service.handle_payment_succeeded(invoice)
        logger.info(f"Successfully processed payment {invoice.id}")
    except Exception as e:
        logger.error(
            f"Error in payment success handling: {str(e)}", exc_info=True)
        raise


def handle_payment_failed(invoice, stripe_service):
    """Handle invoice.payment_failed event"""
    logger.info(f"Processing failed payment: {invoice.id}")
    try:
        stripe_service.handle_payment_failed(invoice)
        logger.info(f"Successfully processed failed payment {invoice.id}")
    except Exception as e:
        logger.error(
            f"Error in payment failure handling: {str(e)}", exc_info=True)
        raise


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
