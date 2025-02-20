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
    division = request.args.get('division', type=int)
    year = request.args.get('year', default=2024, type=int)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT DISTINCT Team FROM batting_war WHERE Division = ? AND Season = ? AND Team = ?",
        (division, year, team_name)
    )
    if not cursor.fetchone():
        return jsonify({"error": "Invalid team name"}), 404

    cursor.execute("""
        SELECT Player,
               Pos,
               BA,
               OBPct as OBP,
               SlgPct as SLG,
               HR,
               SB,
               WAR
        FROM batting_war
        WHERE Team = ? AND Division = ? AND Season = ?
    """, (team_name, division, year))

    data = [dict(zip([col[0] for col in cursor.description], row))
            for row in cursor.fetchall()]

    conn.close()
    return jsonify(data)


@app.route('/api/players-pitch/<team_name>', methods=['GET'])
@require_premium
def get_team_pitchers(team_name):
    division = request.args.get('division', type=int)
    year = request.args.get('year', default=2024, type=int)

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


@app.route('/api/player-percentiles/<player_id>/<int:year>', methods=['GET'])
def get_player_percentiles(player_id, year):
    conn = get_db_connection()
    cursor = conn.cursor()
    response = {"batting": None, "pitching": None}

    try:
        # Check batting stats
        cursor.execute("""
            SELECT * FROM batting_war
            WHERE player_id = ? AND Division = 3 AND Season = ?
        """, (player_id, year))
        player = cursor.fetchone()

        if player:
            cursor.execute("""
                SELECT BA, OBPct, SlgPct, "wOBA", "OPS+", "Batting",
                       "Baserunning", "Adjustment", WAR, PA, "wRC+", "WPA", "REA"
                FROM batting_war
                WHERE PA > 25 AND Division = 3 AND Season = ?
                ORDER BY PA DESC
            """, (year,))
            all_players = cursor.fetchall()
            player_stats = dict(player)

            percentiles = {}
            for stat in ['BA', 'OBPct', 'SlgPct', 'wOBA', 'OPS+', 'Batting',
                         'Baserunning', 'Adjustment', 'WAR', 'wRC+', 'WPA', 'REA']:
                values = [p[stat] for p in all_players if p[stat] is not None]
                player_value = player_stats[stat]
                if values and player_value is not None:
                    values.sort()
                    index = sum(1 for x in values if x <= player_value)
                    percentile = round((index / len(values)) * 100)
                    percentiles[f"{stat}Percentile"] = percentile
                    percentiles[stat] = player_value

            response["batting"] = {
                "type": "batting",
                "stats": percentiles,
                "qualified": player_stats['PA'] > 25,
                "paThreshold": 25,
                "playerPA": player_stats['PA'],
                "season": year
            }

        # Check pitching stats
        cursor.execute("""
            SELECT * FROM pitching_war
            WHERE player_id = ? AND Division = 3 AND Season = ?
        """, (player_id, year))
        player = cursor.fetchone()

        if player:
            cursor.execute("""
                SELECT ERA, FIP, xFIP, "K%", "BB%", "K-BB%", "HR/FB", WAR, IP, RA9, "pWPA", "pREA", "gmLI"
                FROM pitching_war
                WHERE IP > 10 AND Division = 3 AND Season = ?
                ORDER BY IP DESC
            """, (year,))
            all_players = cursor.fetchall()
            player_stats = dict(player)

            percentiles = {}
            reverse_stats = ['ERA', 'FIP', 'xFIP', 'BB%', 'HR/FB', 'RA9']

            for stat in ['ERA', 'FIP', 'xFIP', 'K%', 'BB%', 'K-BB%', 'RA9', 'WAR', 'pREA', 'pWPA', 'gmLI']:
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
                "season": year
            }

        if response["batting"] is None and response["pitching"] is None:
            return jsonify({
                "inactive": True,
                "message": f"Player not active in {year} season"
            })

        return jsonify(response)

    finally:
        conn.close()


@app.route('/api/player/<player_id>', methods=['GET'])
def get_player_stats(player_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        player_found = False
        player_name = None
        current_team = None
        current_conference = None
        current_prev_team_id = None
        current_conference_id = None
        is_pitcher = False
        batting_stats = []
        pitching_stats = []

        # Get stats for all years
        for year in range(2021, 2025):
            # Check batting stats with team/conference IDs
            cursor.execute(f"""
                SELECT b.*, i.prev_team_id, i.conference_id
                FROM batting_war b
                LEFT JOIN ids_for_images i ON b.Team = i.team_name
                WHERE b.player_id = ? AND Division = 3 AND Season = ?
            """, (player_id, year))
            bat_stats = cursor.fetchone()
            if bat_stats:
                player_found = True
                batting_stats.append(dict(bat_stats))
                # Update current info if it's the most recent year we've found
                if not player_name or year > max(s['Season'] for s in batting_stats):
                    player_name = bat_stats["Player"]
                    current_team = bat_stats["Team"]
                    current_conference = bat_stats["Conference"]
                    current_prev_team_id = bat_stats["prev_team_id"]
                    current_conference_id = bat_stats["conference_id"]

            # Check pitching stats with team/conference IDs
            cursor.execute(f"""
                SELECT p.*, i.prev_team_id, i.conference_id
                FROM pitching_war p
                LEFT JOIN ids_for_images i ON p.Team = i.team_name
                WHERE p.player_id = ? AND Division = 3 AND Season = ?
            """, (player_id, year))
            pitch_stats = cursor.fetchone()
            if pitch_stats:
                player_found = True
                pitching_stats.append(dict(pitch_stats))
                # Update current info if it's the most recent year we've found
                if not player_name or year > max(s['Season'] for s in pitching_stats):
                    player_name = pitch_stats["Player"]
                    current_team = pitch_stats["Team"]
                    current_conference = pitch_stats["Conference"]
                    current_prev_team_id = pitch_stats["prev_team_id"]
                    current_conference_id = pitch_stats["conference_id"]
                    is_pitcher = True

        if not player_found:
            return jsonify({"error": "Player not found"}), 404

        is_active = any(stat['Season'] ==
                        2025 for stat in batting_stats + pitching_stats)

        cursor.execute("""
            SELECT r.height, r.bats, r.throws, r.hometown, r.high_school, r.position
            FROM rosters r
            WHERE r.player_id = ? AND Division = 3 AND Year = ?
        """, (player_id, year))
        player_info = cursor.fetchone()

        return jsonify({
            "playerId": player_id,
            "playerName": player_name,
            "currentTeam": current_team,
            "conference": current_conference,
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
        starts_with_term = f"{query}%"
        contains_term = f"%{query}%"
        word_boundary_term = f"% {query}%"

        cursor.execute("""
            SELECT DISTINCT
                player_id,
                player_name as playerName,
                team_name as team,
                conference as conference
            FROM rosters
            WHERE (
                player_name LIKE ? OR 
                player_name LIKE ? OR 
                player_name LIKE ? OR 
                player_name LIKE ?
            ) AND Division = 3
            ORDER BY
                CASE
                    WHEN LOWER(player_name) = ? THEN 1
                    WHEN LOWER(player_name) LIKE ? THEN 2
                    WHEN LOWER(player_name) LIKE ? THEN 3
                    WHEN LOWER(player_name) LIKE ? THEN 4
                    ELSE 5
                END,
                LENGTH(player_name),
                player_name
            LIMIT 5
        """, (
            contains_term,
            starts_with_term,
            word_boundary_term,
            contains_term,
            exact_term,
            starts_with_term.lower(),
            word_boundary_term.lower(),
            contains_term.lower()
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
@require_premium
def get_baserunning_leaderboard():
    start_year = request.args.get('start_year', '2025')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)

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
                    ORDER BY b.Baserunning DESC
                )
                SELECT * FROM baserunning_query
            """
            cursor.execute(query, (division, year))
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
@require_premium
def get_situational_leaderboard():
    start_year = request.args.get('start_year', '2025')
    end_year = request.args.get('end_year', '2025')
    min_pa = request.args.get('min_pa', '50')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)
        min_pa = int(min_pa)
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
                    WHERE s.PA_Overall >= ? 
                        AND p.Division = ? 
                        AND p.Season = ?
                        AND s.year = ?
                    ORDER BY s.wOBA_Overall DESC
                )
                SELECT * FROM situational_query
            """

            cursor.execute(query, (min_pa, division, year, year))
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
@require_premium
def get_splits_leaderboard():
    start_year = request.args.get('start_year', '2025')
    end_year = request.args.get('end_year', '2025')
    min_pa = request.args.get('min_pa', '50')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)
        min_pa = int(min_pa)
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
                    WHERE s.[PA_Overall] >= ? 
                        AND p.Division = ? 
                        AND p.Season = ?
                        AND s.Year = ?
                    ORDER BY s.[wOBA_Overall] DESC
                )
                SELECT * FROM splits_query
            """

            cursor.execute(query, (min_pa, division, year, year))
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
@require_premium
def get_batted_ball_leaders():
    start_year = request.args.get('start_year', '2025')
    end_year = request.args.get('end_year', '2025')
    division = request.args.get('division', type=int, default=3)
    bb_count = request.args.get('min_bb', '50')

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
                        AND bb.count >= ?
                        AND p.Season = ?
                        AND bb.year = ?
                    ORDER BY bb.count DESC
                )
                SELECT * FROM battedball_query
            """

            cursor.execute(query, (division, bb_count, year, year))
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
            bw.Player as batter_name,
            pw.Player as pitcher_name, p.woba, p.division
        FROM pbp p
        LEFT JOIN batting_war bw 
            ON p.batter_id = bw.player_id 
            AND bw.Season = p.year 
            AND bw.Division = p.division
        LEFT JOIN pitching_war pw 
            ON p.pitcher_id = pw.player_id 
            AND pw.Season = p.year
            AND pw.Division = p.division
        WHERE p.game_id = ? 
        AND p.year = ?
        ORDER BY p.inning, p.description
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


@app.route('/api/subscription/status/<user_id>', methods=['GET'])
def check_subscription_status(user_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"isActive": False, "error": "Premium subscription required"}), 403

    try:
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        authorized_user_id = decoded_token['uid']

        db = firestore.client()
        sub_doc = db.collection('subscriptions').document(user_id).get()

        if not sub_doc.exists:
            return jsonify({"isActive": False})

        data = sub_doc.to_dict()
        is_active = (
            data.get('status') == 'active' and
            data.get('expiresAt', datetime.now()
                     ).timestamp() > datetime.now().timestamp()
        )

        return jsonify({
            "isPremium": is_active,
            "status": data.get('status'),
            "planType": data.get('planType'),
            "expiresAt": data.get('expiresAt'),
            "cancelAtPeriodEnd": data.get('cancelAtPeriodEnd', False)
        })

    except Exception as e:
        print(f"Error checking subscription status: {str(e)}")
        return jsonify({"isActive": False, "error": str(e)}), 500


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
