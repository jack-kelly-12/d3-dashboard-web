from flask import Blueprint, jsonify, request
import sqlite3
from db import get_db_connection
from config import MIN_YEAR
import firebase_admin
from firebase_admin import firestore

bp = Blueprint('team_data', __name__, url_prefix='/api')
app = bp

@app.route('/teams', methods=['GET'])
def get_teams():
    division = request.args.get('division', 3, type=int)
    year = request.args.get('year', type=int)
    years_param = request.args.get('years')

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    years = []
    if years_param:
        try:
            years = [int(y) for y in years_param.split(',') if y.strip()]
        except ValueError:
            return jsonify({"error": "Invalid years parameter"}), 400
    elif year is not None:
        years = [year]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if years:
            placeholders = ','.join(['?'] * len(years))
            query = f"SELECT DISTINCT team_name FROM rosters WHERE division = ? AND year IN ({placeholders})"
            cursor.execute(query, (division, *years))
        else:
            cursor.execute(
                "SELECT DISTINCT team_name FROM rosters WHERE division = ?",
                (division,)
            )
        data = cursor.fetchall()
    finally:
        conn.close()

    teams = [{"team_id": idx + 1, "team_name": row[0]}
             for idx, row in enumerate(sorted(data, key=lambda r: r[0]))]

    return jsonify(teams)


@app.route('/players_batting/<team_name>', methods=['GET'])
def get_team_players(team_name):
    try:
        division = request.args.get('division')
        year = request.args.get('year', 'MAX_YEAR')

        if not division:
            return jsonify({"error": "division parameter is required"}), 400

        try:
            year = int(year)
            division = int(division)
        except ValueError:
            return jsonify({"error": "year and division must be valid numbers"}), 400

        if division not in [1, 2, 3]:
            return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DISTINCT team_name
            FROM batting
            WHERE division = ? AND year = ? AND team_name = ?
            """, (division, year, team_name))

        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": f"No data found for team {team_name} in division {division} for year {year}"}), 404

        cursor.execute("""
            SELECT b.player_name,
                   b.player_id,
                   r.position,
                   b.ba,
                   b.ob_pct,
                   b.slg_pct,
                   b.hr,
                   b.sb,
                   b.war
            FROM batting b
            LEFT JOIN rosters r ON b.player_id = r.player_id AND b.year = r.year AND b.division = r.division
            WHERE b.team_name = ?
            AND b.year = ?
            AND b.division = ?
            ORDER BY b.war DESC
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


@app.route('/players_pitching/<team_name>', methods=['GET'])
def get_team_pitchers(team_name):
    division = request.args.get('division', type=int)
    year = request.args.get('year', 'MAX_YEAR')

    year = int(year)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT team_name FROM pitching WHERE division = ? AND year = ? AND team_name = ?
    """, (division, year, team_name))

    if not cursor.fetchone():
        return jsonify({"error": "Invalid team name"}), 404

    cursor.execute("""
        SELECT p.player_name,
               p.player_id,
               r.position,
               p.era,
               p.fip,
               p.k_pct,
               p.bb_pct,
               p.ip,
               p.war
        FROM pitching p
        LEFT JOIN rosters r ON p.player_id = r.player_id AND p.year = r.year AND p.division = r.division
        WHERE p.team_name = ? AND p.division = ? AND p.year = ?
    """, (team_name, division, year))

    data = [dict(zip([col[0] for col in cursor.description], row))
            for row in cursor.fetchall()]

    conn.close()
    return jsonify(data)


@bp.get('/trending-players')
def get_trending_players():
    limit = request.args.get('limit', type=int, default=10)
    
    if limit < 1 or limit > 100:
        return jsonify({"error": "Limit must be between 1 and 100"}), 400
    
    try:
        db = firestore.client()
        docs = db.collection('playerPageVisits').order_by('visitCount', direction=firestore.Query.DESCENDING).limit(limit).stream()
        
        trending = []
        for doc in docs:
            data = doc.to_dict()
            trending.append({
                'playerId': data.get('playerId'),
                'playerName': data.get('playerName'),
                'visitCount': data.get('visitCount', 0),
                'lastVisitedAt': data.get('lastVisitedAt'),
            })
        
        return jsonify(trending)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
