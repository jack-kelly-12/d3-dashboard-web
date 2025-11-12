from flask import Blueprint, jsonify, request
import sqlite3
from db import get_db_connection
from config import MIN_YEAR

bp = Blueprint('games', __name__, url_prefix='/api')


@bp.get('/games/<int:year>/<contest_id>')
def get_game(year, contest_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT DISTINCT
            p.home_team, p.away_team, p.home_score, p.away_score, p.date as game_date,
            p.inning, p.top_inning, p.contest_id, p.description,
            p.home_win_exp_before, p.home_win_exp_after, p.wpa, p.run_expectancy_delta,
            p.batter_id, p.pitcher_id,
            p.li, p.home_score_after, p.away_score_after,
            p.play_id,
            r_batter.player_name as batter_name,
            r_pitcher.player_name as pitcher_name, p.woba, p.division,
            s.attendance as attendance
        FROM pbp p
        LEFT JOIN rosters r_batter
            ON p.batter_id = r_batter.player_id
            AND p.year = r_batter.year
            AND p.division = r_batter.division
        LEFT JOIN rosters r_pitcher
            ON p.pitcher_id = r_pitcher.player_id
            AND p.year = r_pitcher.year
            AND p.division = r_pitcher.division
        LEFT JOIN schedules s
            ON s.contest_id = p.contest_id
            AND s.year = p.year
            AND s.division = p.division
        WHERE p.contest_id = ?
        AND p.year = ?
        ORDER BY CAST(p.play_id AS INTEGER) ASC, p.inning ASC, p.top_inning DESC
        """,
        (contest_id, year),
    )

    plays = [dict(row) for row in cursor.fetchall()]

    if not plays:
        return jsonify({"error": "Game not found"}), 404

    home_team = plays[0]['home_team']
    away_team = plays[0]['away_team']
    division = plays[0]['division']

    cursor.execute(
        """
        SELECT MAX(org_id) AS org_id
        FROM rosters
        WHERE team_name = ? AND year = ? AND division = ?
        """,
        (home_team, year, division),
    )
    home_row = cursor.fetchone()
    home_team_id = home_row["org_id"] if home_row and "org_id" in home_row.keys() else None

    cursor.execute(
        """
        SELECT MAX(org_id) AS org_id
        FROM rosters
        WHERE team_name = ? AND year = ? AND division = ?
        """,
        (away_team, year, division),
    )
    away_row = cursor.fetchone()
    away_team_id = away_row["org_id"] if away_row and "org_id" in away_row.keys() else None

    game_info = {
        'home_team': home_team,
        'away_team': away_team,
        'game_date': plays[0]['game_date'],
        'contest_id': plays[0]['contest_id'],
        'division': division,
        'attendance': plays[0].get('attendance') if isinstance(plays[0], dict) else None,
        'home_team_id': home_team_id,
        'away_team_id': away_team_id,
        'plays': plays,
    }

    conn.close()
    return jsonify(game_info)


@bp.get('/games')
def get_games_by_date():
    """
    Games by date
    ---
    tags:
      - Games
    parameters:
      - in: query
        name: month
        schema: { type: string }
        required: true
      - in: query
        name: day
        schema: { type: string }
        required: true
      - in: query
        name: year
        schema: { type: integer }
        required: true
      - in: query
        name: division
        schema: { type: integer, enum: [1,2,3] }
        default: 3
    responses:
      200:
        description: List of games
      400:
        description: Invalid parameters
    """
    month = request.args.get('month')
    day = request.args.get('day')
    year = request.args.get('year')
    division = request.args.get('division', type=int, default=3)

    if not month or not day or not year:
        return jsonify({"error": "Missing required query parameters: month, day, year"}), 400

    try:
        year = int(year)

        if year < MIN_YEAR:
            return jsonify({"error": f"No games available for year {year}. Please select a year between MIN_YEAR and MAX_YEAR"}), 400

        game_date = f"{month}/{day}/{year}"

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            WITH team_org AS (
                SELECT team_name, year, division, MAX(org_id) AS org_id
                FROM rosters
                GROUP BY team_name, year, division
            ),
            games AS (
                SELECT 
                    p.contest_id,
                    p.year,
                    p.home_team,
                    p.away_team,
                    MAX(p.home_score_after) AS home_score,
                    MAX(p.away_score_after) AS away_score,
                    p.date AS game_date
                FROM pbp p
                WHERE p.date = ? AND p.division = ?
                GROUP BY p.contest_id, p.year, p.home_team, p.away_team, p.date
            )
            SELECT 
                g.contest_id,
                g.year,
                g.home_team,
                g.away_team,
                g.home_score,
                g.away_score,
                g.game_date,
                rh.org_id AS home_org_id,
                ra.org_id AS away_org_id
            FROM games g
            LEFT JOIN team_org rh
                ON rh.team_name = g.home_team
                AND rh.year = g.year
                AND rh.division = ?
            LEFT JOIN team_org ra
                ON ra.team_name = g.away_team
                AND ra.year = g.year
                AND ra.division = ?
            ORDER BY g.contest_id
            """,
            (game_date, division, division, division),
        )

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
