from typing import Dict, List, Optional
from datetime import datetime
from typing import Dict, List, Optional, Union
from flask import jsonify
from flask import Flask, jsonify, request, g
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
from firebase_admin import firestore, auth, credentials
from functools import wraps
from stripe_service import StripeService


app = Flask(__name__, static_folder='../frontend/build/', static_url_path='/')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
stripe.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')


cred = credentials.Certificate(
    "d3-dash-13dc4-firebase-adminsdk-5y2t3-1582956c98.json")
firebase_admin.initialize_app(cred)


CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://d3-dashboard.com",
            "https://www.d3-dashboard.com",
            "http://d3-dashboard.com",
            "http://www.d3-dashboard.com",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = 'ncaa.db'
load_dotenv()


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
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

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
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

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
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

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
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

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


@app.route('/api/teams-2024', methods=['GET'])
@require_premium
def get_teams():
    division = request.args.get('division', 3, type=int)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT DISTINCT Team as team_name FROM batting_war WHERE Division = ? AND Season = 2024",
        (division,)
    )
    data = cursor.fetchall()

    conn.close()

    teams = [{"team_id": idx + 1, "team_name": row[0]}
             for idx, row in enumerate(data)]

    return jsonify(teams)


@app.route('/api/players-hit-2024/<team_name>', methods=['GET'])
@require_premium
def get_team_players(team_name):
    division = request.args.get('division', type=int)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT DISTINCT Team FROM batting_war WHERE Division = ? AND Season = 2024 AND Team = ?",
        (division, team_name)
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
        WHERE Team = ? AND Division = ? AND Season = 2024
    """, (team_name, division))

    data = [dict(zip([col[0] for col in cursor.description], row))
            for row in cursor.fetchall()]

    conn.close()
    return jsonify(data)


@app.route('/api/players-pitch-2024/<team_name>', methods=['GET'])
@require_premium
def get_team_pitchers(team_name):
    division = request.args.get('division', type=int)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT DISTINCT Team FROM pitching_war WHERE Division = ? AND Season = 2024 AND Team = ?",
        (division, team_name)
    )
    if not cursor.fetchone():
        return jsonify({"error": "Invalid team name"}), 404

    cursor.execute("""
        SELECT Player,
               ERA,
               FIP,
               "K%" as strikeout_rate,
               "BB%" as walk_rate,
               IP,
               WAR
        FROM pitching_war
        WHERE Team = ? AND Division = ? AND Season = 2024
    """, (team_name, division))

    data = [dict(zip([col[0] for col in cursor.description], row))
            for row in cursor.fetchall()]

    conn.close()
    return jsonify(data)


@app.route('/api/expected-runs', methods=['GET'])
@require_premium
def get_expected_runs():
    year = request.args.get('year', '2024')
    division = request.args.get('division', default=3, type=int)

    try:
        year = int(year)
        if not (2021 <= year <= 2024):
            return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

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


@app.route('/api/player-percentiles/<player_id>', methods=['GET'])
def get_player_percentiles(player_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    response = {"batting": None, "pitching": None}

    try:
        # Check batting stats
        cursor.execute("""
            SELECT * FROM batting_war
            WHERE player_id = ? AND Division = 3 AND Season = 2024
        """, (player_id,))
        player = cursor.fetchone()

        if player:
            cursor.execute("""
                SELECT BA, OBPct, SlgPct, "wOBA", "OPS+", "Batting",
                       "Baserunning", "Adjustment", WAR, PA, "wRC+"
                FROM batting_war
                WHERE PA > 25 AND Division = 3 AND Season = 2024
                ORDER BY PA DESC
            """)
            all_players = cursor.fetchall()
            player_stats = dict(player)

            percentiles = {}
            for stat in ['BA', 'OBPct', 'SlgPct', 'wOBA', 'OPS+', 'Batting',
                         'Baserunning', 'Adjustment', 'WAR', 'wRC+']:
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
                "playerPA": player_stats['PA']
            }

        # Check pitching stats
        cursor.execute("""
            SELECT * FROM pitching_war
            WHERE player_id = ? AND Division = 3 AND Season = 2024
        """, (player_id,))
        player = cursor.fetchone()

        if player:
            cursor.execute("""
                SELECT ERA, FIP, xFIP, "K%", "BB%", "K-BB%", "HR/FB", WAR, IP, RA9
                FROM pitching_war
                WHERE IP > 10 AND Division = 3 AND Season = 2024
                ORDER BY IP DESC
            """)
            all_players = cursor.fetchall()
            player_stats = dict(player)

            percentiles = {}
            reverse_stats = ['ERA', 'FIP', 'xFIP', 'BB%', 'HR/FB', 'RA9']

            for stat in ['ERA', 'FIP', 'xFIP', 'K%', 'BB%', 'K-BB%', 'RA9', 'WAR']:
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
                "playerIP": player_stats['IP']
            }

        if response["batting"] is None and response["pitching"] is None:
            return jsonify({
                "inactive": True,
                "message": "Player not active in 2024 season"
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

        # Check if player is active in 2024
        is_active = any(stat['Season'] ==
                        2024 for stat in batting_stats + pitching_stats)

        return jsonify({
            "playerId": player_id,
            "playerName": player_name,
            "currentTeam": current_team,
            "conference": current_conference,
            "prev_team_id": current_prev_team_id,
            "conference_id": current_conference_id,
            "isPitcher": is_pitcher,
            "isActive": is_active,
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
        # Create search terms for different match types
        exact_term = query
        starts_with_term = f"{query}%"
        contains_term = f"%{query}%"
        # Matches start of any word after first
        word_boundary_term = f"% {query}%"

        cursor.execute("""
            SELECT DISTINCT
                player_id,
                Player as playerName,
                Team as team,
                Conference as conference
            FROM (
                SELECT player_id, Player, Team, Conference
                FROM batting_war
                WHERE Division = 3
                UNION
                SELECT player_id, Player, Team, Conference
                FROM pitching_war
                WHERE Division = 3 AND Season = 2024
            )
            WHERE Player LIKE ? OR Player LIKE ? OR Player LIKE ? OR Player LIKE ?
            ORDER BY
                CASE
                    WHEN LOWER(Player) = LOWER(?) THEN 1  -- Exact match (case insensitive)
                    WHEN LOWER(Player) LIKE LOWER(?) THEN 2  -- Starts with query
                    WHEN LOWER(Player) LIKE LOWER(?) THEN 3  -- Starts with query after space
                    WHEN LOWER(Player) LIKE LOWER(?) THEN 4  -- Contains query anywhere
                    ELSE 5
                END,
                LENGTH(Player),  -- Prefer shorter names when relevance is equal
                Player  -- Alphabetical as final tiebreaker
            LIMIT 5
        """, (contains_term, starts_with_term, word_boundary_term, contains_term,
              exact_term, starts_with_term, word_boundary_term, contains_term))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    finally:
        conn.close()


@app.route('/api/upload/rapsodo', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)  # Add this decorator
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
                WHERE Division = ? AND Season = 2024
                UNION
                SELECT Conference 
                FROM pitching_war 
                WHERE Division = ? AND Season = 2024
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
    start_year = request.args.get('start_year', '2024')
    end_year = request.args.get('end_year', '2024')
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
    start_year = request.args.get('start_year', '2024')
    end_year = request.args.get('end_year', '2024')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < 2021 or end_year > 2024 or start_year > end_year:
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
    start_year = request.args.get('start_year', '2024')
    end_year = request.args.get('end_year', '2024')
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

    if start_year < 2021 or end_year > 2024 or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    results = []

    try:
        for year in range(start_year, end_year + 1):
            query = """
                WITH situational_query AS (
                    SELECT DISTINCT  -- Add DISTINCT to remove any remaining duplicates
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
                        s.REA_Overall,
                        s.REA_High_Leverage,
                        s.REA_Low_Leverage,
                        s.REA_RISP, 
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
            p.batter_id, p.player_id, p.pitcher_id, p.li, p.home_score_after, p.away_score_after,
            bw.Player as batter_name,
            pw.Player as pitcher_name, p.woba
        FROM pbp p
        LEFT JOIN batting_war bw ON p.batter_id = bw.player_id AND bw.Season = p.year 
        LEFT JOIN pitching_war pw ON p.pitcher_id = pw.player_id AND pw.Season = p.year
        WHERE p.game_id = ? 
        AND p.description IS NOT NULL 
        AND p.year = ?
    """, (game_id, year))

    plays = [dict(row) for row in cursor.fetchall()]

    if not plays:
        return jsonify({"error": "Game not found"}), 404

    game_info = {
        'home_team': plays[0]['home_team'],
        'away_team': plays[0]['away_team'],
        'game_date': plays[0]['game_date'],
        'game_id': plays[0]['game_id'],
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

        if year < 2021:  # Changed to 2024 as upper limit
            return jsonify({"error": f"No games available for year {year}. Please select a year between 2021 and 2024"}), 400

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


@app.route('/api/projections-hit-25', methods=['GET'])
def get_projections_hit():
    min_pa = request.args.get('min_pa', '25')

    try:
        min_pa = int(min_pa)
    except ValueError:
        return jsonify({"error": "Invalid min_pa parameter"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = """
            WITH projections AS (
                SELECT 
                    p.Player,
                    p.Team,
                    p.Conference,
                    p.player_id,
                    p.Yr,
                    p.Pos,
                    p.PA,
                    p.H,
                    p.BB,
                    p."K" as K,
                    p.BA,
                    p.OBPct,
                    p.SLGPct,
                    p.wOBA,
                    p.Batting,
                    p.Baserunning,
                    p.Adjustment,
                    p.WAR,
                    i.prev_team_id,
                    i.conference_id
                FROM projections_bat_25 p
                LEFT JOIN ids_for_images i 
                    ON p.Team = i.team_name
                WHERE p.PA >= ?
                ORDER BY p.WAR DESC
            )
            SELECT * FROM projections
        """

        cursor.execute(query, (min_pa,))
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/projections-pitch-25', methods=['GET'])
def get_projections_pitch():
    min_ip = request.args.get('min_ip', '10')

    try:
        min_ip = int(min_ip)
    except ValueError:
        return jsonify({"error": "Invalid min_ip parameter"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = """
            WITH projections AS (
                SELECT 
                    p.Player,
                    p.Team,
                    p.Conference,
                    p.player_id,
                    p.Yr,
                    p.App,
                    p.GS,
                    p.IP,
                    p.H,
                    p.R,
                    p.ER,
                    p.BB,
                    p.SO,
                    p."HR-A",
                    p."2B-A",
                    p."3B-A",
                    p.HB,
                    p.BF,
                    p.FO,
                    p.GO,
                    p.Pitches,
                    p.gmLI,
                    p."BB%",
                    p."K%",
                    p."K-BB%",
                    p."HR/FB",
                    p.FIP,
                    p.xFIP,
                    p."ERA+",
                    ROUND(9.0 * p.ER / NULLIF(p.IP, 0), 2) as ERA,
                    p.WAR,
                    i.prev_team_id,
                    i.conference_id
                FROM projections_pitch_25 p
                LEFT JOIN ids_for_images i 
                    ON p.Team = i.team_name
                WHERE p.IP >= ?
                ORDER BY p.WAR DESC
            )
            SELECT * FROM projections
        """

        cursor.execute(query, (min_ip,))
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return jsonify(results)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        conn.close()


@app.route('/api/insights/query', methods=['POST'])
def query_insights():
    try:
        insights_processor = InsightsProcessor()
        data = request.get_json()
        question = data['question'].strip()

        if len(question) > 1000:
            return jsonify({
                "status": "error",
                "message": "Question too long",
                "data": None
            }), 400

        # Process with explicit thought process
        result = insights_processor.process_question(question)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error processing question: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e),
            "data": None
        }), 500


def init_stripe(app):
    db = firestore.client()
    stripe_service = StripeService(db)
    setup_stripe_routes(app, stripe_service)


if __name__ == '__main__':
    init_stripe(app)
    app.run(host='0.0.0.0', port=8000)
