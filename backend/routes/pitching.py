from flask import Blueprint, jsonify, request
from config import MIN_YEAR, MAX_YEAR
from db import get_db_connection


bp = Blueprint('pitching', __name__, url_prefix='/api')


@bp.get('/pitching')
def get_pitching():
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
               PERCENT_RANK() OVER (PARTITION BY year ORDER BY war) * 100 as war_percentile
        FROM pitching p
        WHERE p.division = ? AND p.year IN ({placeholders})
        ORDER BY p.war DESC
    """

    cursor.execute(query, [division] + years)

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@bp.get('/pitching_team')
def get_pitching_team():
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
               PERCENT_RANK() OVER (PARTITION BY year ORDER BY war) * 100 as war_percentile
        FROM pitching_team pt
        WHERE pt.division = ? AND pt.year IN ({placeholders})
        ORDER BY pt.war DESC
    """

    cursor.execute(query, [division] + years)

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


