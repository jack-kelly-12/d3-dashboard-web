from flask import Blueprint, jsonify, request
from config import MIN_YEAR, MAX_YEAR
from db import get_db_connection


bp = Blueprint('batting', __name__, url_prefix='/api')


@bp.get('/batting')
def get_batting():
    """
    Get batting leaderboard
    ---
    tags:
      - Batting
    parameters:
      - in: query
        name: years
        schema:
          type: string
        description: Single year or comma-separated years
      - in: query
        name: division
        schema:
          type: integer
          enum: [1,2,3]
        default: 3
    responses:
      200:
        description: Batting rows
      400:
        description: Invalid parameters
    """
    years_param = request.args.get('years', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        if ',' in years_param:
            years = [int(y.strip()) for y in years_param.split(',')]
        else:
            years = [int(years_param)]

        for year in years:
            if year < MIN_YEAR or year > MAX_YEAR:
                return jsonify({"error": f"Invalid year {year}. Must be between MIN_YEAR and MAX_YEAR."}), 400
    except ValueError:
        return jsonify({"error": "Invalid years format. Use single year or comma-separated list (e.g., '2024' or '2023,2024,MAX_YEAR')"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    placeholders = ','.join(['?' for _ in years])
    query = f"""
        SELECT *,
               PERCENT_RANK() OVER (PARTITION BY year ORDER BY war) * 100 as war_percentile,
               PERCENT_RANK() OVER (PARTITION BY year ORDER BY sos_adj_war) * 100 as sos_adj_war_percentile
        FROM batting b
        WHERE b.division = ? AND b.year IN ({placeholders})
        ORDER BY b.war DESC
    """

    cursor.execute(query, [division] + years)

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@bp.get('/batting_team')
def get_batting_team():
    years_param = request.args.get('years', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        if ',' in years_param:
            years = [int(y.strip()) for y in years_param.split(',')]
        else:
            years = [int(years_param)]

        for year in years:
            if year < MIN_YEAR or year > MAX_YEAR:
                return jsonify({"error": f"Invalid year {year}. Must be between MIN_YEAR and MAX_YEAR."}), 400
    except ValueError:
        return jsonify({"error": "Invalid years format. Use single year or comma-separated list (e.g., '2024' or '2023,2024,MAX_YEAR')"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    placeholders = ','.join(['?' for _ in years])
    query = f"""
        SELECT *,
               PERCENT_RANK() OVER (PARTITION BY year ORDER BY war) * 100 as war_percentile,
               PERCENT_RANK() OVER (PARTITION BY year ORDER BY sos_adj_war) * 100 as sos_adj_war_percentile
        FROM batting_team bt
        WHERE bt.division = ? AND bt.year IN ({placeholders})
        ORDER BY bt.war DESC
    """

    cursor.execute(query, [division] + years)

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


