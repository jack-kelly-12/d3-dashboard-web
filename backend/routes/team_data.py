from flask import Blueprint, jsonify, request
import sqlite3
from db import get_db_connection
from config import MIN_YEAR, MAX_YEAR
from firebase_admin import firestore
from middleware import require_api_auth

bp = Blueprint('team_data', __name__, url_prefix='/api')
app = bp

@app.route('/teams', methods=['GET'])
@require_api_auth
def get_teams():
    """
    Get list of teams
    ---
    tags:
      - Reference
    parameters:
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        default: 3
      - in: query
        name: year
        schema:
          type: integer
        description: Filter by specific year
      - in: query
        name: years
        schema:
          type: string
        description: Comma-separated years
    responses:
      200:
        description: List of team names
      400:
        description: Invalid division
    """
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
@require_api_auth
def get_team_players(team_name):
    try:
        division = request.args.get('division')
        year = request.args.get('year', str(MAX_YEAR))

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
@require_api_auth
def get_team_pitchers(team_name):
    division = request.args.get('division', type=int)
    year = request.args.get('year', str(MAX_YEAR))

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
@require_api_auth
def get_trending_players():
    limit = request.args.get('limit', type=int, default=10)
    
    if limit < 1 or limit > 100:
        return jsonify({"error": "Limit must be between 1 and 100"}), 400
    
    try:
        db = firestore.client()
        docs = db.collection('playerPageVisits').order_by('visitCount', direction=firestore.Query.DESCENDING).limit(limit).stream()
        
        trending = []
        for doc in docs:
            try:
                data = doc.to_dict()
                if data and data.get('playerId'):
                    trending.append({
                        'playerId': data.get('playerId'),
                        'playerName': data.get('playerName', 'Unknown'),
                        'visitCount': data.get('visitCount', 0),
                        'lastVisitedAt': data.get('lastVisitedAt'),
                    })
            except Exception as doc_error:
                print(f"Error processing document {doc.id}: {doc_error}")
                continue
        
        return jsonify(trending)
    except Exception as e:
        print(f"Error fetching trending players: {e}")
        return jsonify({"error": "Failed to fetch trending players. Please try again later."}), 500


@bp.get('/team_history')
@require_api_auth
def get_team_history():
    """
    Get all team history data
    ---
    tags:
      - Teams
    parameters:
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        description: Filter by division
      - in: query
        name: org_id
        schema:
          type: integer
        description: Filter by organization ID
    responses:
      200:
        description: List of team history records
    """
    division = request.args.get('division', type=int)
    org_id = request.args.get('org_id', type=int)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = "SELECT * FROM team_history WHERE 1=1"
        params = []

        if division:
            query += " AND division = ?"
            params.append(str(division))

        if org_id:
            query += " AND org_id = ?"
            params.append(org_id)

        query += " ORDER BY org_id, season DESC"

        cursor.execute(query, params)
        data = [dict(row) for row in cursor.fetchall()]
        return jsonify(data)

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/team_history/<int:org_id>')
@require_api_auth
def get_team_history_by_org(org_id):
    """
    Get team history for a specific organization
    ---
    tags:
      - Teams
    parameters:
      - in: path
        name: org_id
        schema:
          type: integer
        required: true
        description: Organization ID (persistent across years)
    responses:
      200:
        description: Team history for the organization
      404:
        description: Organization not found
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM team_history WHERE org_id = ? ORDER BY season DESC",
            (org_id,)
        )
        data = [dict(row) for row in cursor.fetchall()]

        if not data:
            return jsonify({"error": "Organization not found"}), 404

        return jsonify(data)

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/team_games/<int:team_id>')
@require_api_auth
def get_games_by_team_id(team_id):
    """
    Get all games for a team by team_id (year-specific)
    ---
    tags:
      - Games
    parameters:
      - in: path
        name: team_id
        schema:
          type: integer
        required: true
        description: Team ID (specific to a year)
      - in: query
        name: year
        schema:
          type: integer
        description: Filter by year
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        default: 3
    responses:
      200:
        description: List of games for the team
    """
    year = request.args.get('year', type=int)
    division = request.args.get('division', type=int, default=3)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = """
            SELECT DISTINCT
                s.contest_id,
                s.year,
                s.division,
                s.date,
                s.team,
                s.team_id,
                s.opponent,
                s.opponent_team_id,
                s.team_score,
                s.opponent_score,
                s.innings,
                s.attendance,
                s.neutral_site,
                CASE 
                    WHEN s.team_score > s.opponent_score THEN 'W'
                    WHEN s.team_score < s.opponent_score THEN 'L'
                    ELSE 'T'
                END as result
            FROM schedules s
            WHERE (s.team_id = ? OR s.opponent_team_id = ?)
            AND s.division = ?
        """
        params = [team_id, team_id, division]

        if year:
            query += " AND s.year = ?"
            params.append(year)

        query += " ORDER BY s.year DESC, s.date DESC"

        cursor.execute(query, params)
        data = [dict(row) for row in cursor.fetchall()]
        return jsonify(data)

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/org_games/<int:org_id>')
@require_api_auth
def get_games_by_org_id(org_id):
    """
    Get all games for an organization across all years
    ---
    tags:
      - Games
    parameters:
      - in: path
        name: org_id
        schema:
          type: integer
        required: true
        description: Organization ID (persistent across years)
      - in: query
        name: start_year
        schema:
          type: integer
        description: Start year for filtering
      - in: query
        name: end_year
        schema:
          type: integer
        description: End year for filtering
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        default: 3
    responses:
      200:
        description: List of games for the organization across years
    """
    start_year = request.args.get('start_year', type=int, default=MIN_YEAR)
    end_year = request.args.get('end_year', type=int, default=MAX_YEAR)
    division = request.args.get('division', type=int, default=3)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT team_id FROM team_history WHERE org_id = ?",
            (org_id,)
        )
        team_ids = [row['team_id'] for row in cursor.fetchall() if row['team_id']]

        if not team_ids:
            return jsonify([])

        placeholders = ','.join(['?'] * len(team_ids))
        query = f"""
            SELECT DISTINCT
                s.contest_id,
                s.year,
                s.division,
                s.date,
                s.team,
                s.team_id,
                s.opponent,
                s.opponent_team_id,
                s.team_score,
                s.opponent_score,
                s.innings,
                s.attendance,
                s.neutral_site,
                CASE 
                    WHEN s.team_score > s.opponent_score THEN 'W'
                    WHEN s.team_score < s.opponent_score THEN 'L'
                    ELSE 'T'
                END as result
            FROM schedules s
            WHERE (s.team_id IN ({placeholders}) OR s.opponent_team_id IN ({placeholders}))
            AND s.division = ?
            AND s.year BETWEEN ? AND ?
            ORDER BY s.year DESC, s.date DESC
        """
        params = team_ids + team_ids + [division, start_year, end_year]

        cursor.execute(query, params)
        data = [dict(row) for row in cursor.fetchall()]
        return jsonify(data)

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()
