from datetime import datetime
from typing import Dict, List, Optional, Union
from flask import jsonify
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import pandas as pd
from io import StringIO
import json
from werkzeug.utils import secure_filename
import os

app = Flask(__name__, static_folder='../frontend/build/', static_url_path='/')

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://d3-dashboard.com",
            "https://www.d3-dashboard.com",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

DB_PATH = 'ncaa.db'


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/api/batting_war/<int:year>', methods=['GET'])
def get_batting_war(year):
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM batting_war_{year}")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/pitching_war/<int:year>', methods=['GET'])
def get_pitching_war(year):
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM pitching_war_{year}")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/batting_team_war/<int:year>', methods=['GET'])
def get_batting_team_war_war(year):
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM batting_team_war_{year}")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/pitching_team_war/<int:year>', methods=['GET'])
def get_pitching_team_war(year):
    if year < 2021 or year > 2024:
        return jsonify({"error": "Invalid year. Must be between 2021 and 2024."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM pitching_team_war_{year}")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/guts', methods=['GET'])
def get_guts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM guts_constants")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/park-factors', methods=['GET'])
def get_pf():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM park_factors")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/teams-2024', methods=['GET'])
def get_teams():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT team_id, team_name FROM batting_2024")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/players-hit-2024/<team_id>', methods=['GET'])
def get_team_players(team_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT b.Player, 
               b.Pos, 
               b.BA, 
               b.OBPct as OBP, 
               b.SlgPct as SLG, 
               b.HR, 
               b.SB, 
               b.WAR
        FROM batting_war_2024 AS b 
        LEFT JOIN batting_2024 AS t ON b.Team = t.team_name
        WHERE t.team_id = {team_id}
    """)
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/players-pitch-2024/<team_id>', methods=['GET'])
def get_team_pitchers(team_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT p.Player, 
               p.ERA, 
               p.FIP, 
               p."K%" as "K%",
               p."BB%" as "BB%",
               p.IP, 
               p.WAR
        FROM pitching_war_2024 AS p 
        LEFT JOIN pitching_2024 AS t ON p.Team = t.team_name
        WHERE t.team_id = {team_id}
    """)
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/expected-runs', methods=['GET'])
def get_expected_runs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM expected_runs ORDER BY Year DESC")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/player-percentiles/<player_id>', methods=['GET'])
def get_player_percentiles(player_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if player exists in 2024 batting stats
        cursor.execute("""
            SELECT * FROM batting_war_2024
            WHERE player_id = ?
        """, (player_id,))
        player = cursor.fetchone()

        if player:
            # Get all batters with PA > 25
            cursor.execute("""
                SELECT BA, OBPct, SlgPct, "wOBA", "OPS+", "Batting", 
                       "Baserunning", "Adjustment", WAR, PA, "wRC+"
                FROM batting_war_2024
                WHERE PA > 25
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

            return jsonify({
                "type": "batting",
                "stats": percentiles,
                "qualified": player_stats['PA'] > 25,
                "paThreshold": 25,
                "playerPA": player_stats['PA']
            })

        # Check if player exists in 2024 pitching stats
        cursor.execute("""
            SELECT * FROM pitching_war_2024
            WHERE player_id = ?
        """, (player_id,))
        player = cursor.fetchone()

        if player:
            # Get all pitchers with IP > 10
            cursor.execute("""
                SELECT ERA, FIP, xFIP, "K%", "BB%", "K-BB%", "HR/FB", WAR, IP, "RA9"
                FROM pitching_war_2024
                WHERE IP > 10
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

            return jsonify({
                "type": "pitching",
                "stats": percentiles,
                "qualified": player_stats['IP'] > 10,
                "ipThreshold": 10,
                "playerIP": player_stats['IP']
            })

        # If player not found in either 2024 table, return inactive status instead of 404
        return jsonify({
            "inactive": True,
            "message": "Player not active in 2024 season"
        })

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
        is_pitcher = False
        batting_stats = []
        pitching_stats = []

        # Get stats for all years
        for year in range(2021, 2025):
            # Check batting stats
            cursor.execute(f"""
                SELECT * FROM batting_war_{year} 
                WHERE player_id = ?
            """, (player_id,))
            bat_stats = cursor.fetchone()
            if bat_stats:
                player_found = True
                batting_stats.append(dict(bat_stats))
                # Update current info if it's the most recent year we've found
                if not player_name or year > max(s['Season'] for s in batting_stats):
                    player_name = bat_stats["Player"]
                    current_team = bat_stats["Team"]
                    current_conference = bat_stats["Conference"]

            # Check pitching stats
            cursor.execute(f"""
                SELECT * FROM pitching_war_{year} 
                WHERE player_id = ?
            """, (player_id,))
            pitch_stats = cursor.fetchone()
            if pitch_stats:
                player_found = True
                pitching_stats.append(dict(pitch_stats))
                # Update current info if it's the most recent year we've found
                if not player_name or year > max(s['Season'] for s in pitching_stats):
                    player_name = pitch_stats["Player"]
                    current_team = pitch_stats["Team"]
                    current_conference = pitch_stats["Conference"]
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
                FROM batting_war_2024
                UNION
                SELECT player_id, Player, Team, Conference 
                FROM pitching_war_2024
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


@app.route('/api/upload/rapsodo', methods=['POST'])
def upload_rapsodo():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

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

                pitch = {
                    'player': player_name,
                    'timestamp': pd.to_datetime(row['Date']).isoformat() if pd.notna(row.get('Date')) else None,
                    'type': str(pitch_type).lower(),
                    'velocity': float(row['Velocity']) if pd.notna(row.get('Velocity')) else None,
                    'spinRate': float(row['Total Spin']) if pd.notna(row.get('Total Spin')) else None,
                    'source': 'rapsodo'
                }
                processed_pitches.append(pitch)

            except Exception as e:
                continue

        if not processed_pitches:
            return jsonify({"error": "No valid pitches found in file"}), 400

        return jsonify({
            'pitches': processed_pitches
        })

    except Exception as e:
        print(f"Major error processing file: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@app.route('/api/upload/trackman', methods=['POST'])
def upload_trackman():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

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
                'source': 'trackman'
            }
            processed_pitches.append(pitch)

        return jsonify({
            'pitches': processed_pitches,
            'playerInfo': {
                'pitcher': df['Pitcher'].iloc[0] if 'Pitcher' in df.columns else None,
                'team': df['PitcherTeam'].iloc[0] if 'PitcherTeam' in df.columns else None
            }
        })

    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
