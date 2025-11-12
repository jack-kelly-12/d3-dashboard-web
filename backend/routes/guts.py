from flask import Blueprint, jsonify, request
from db import get_db_connection
from config import MIN_YEAR, MAX_YEAR

bp = Blueprint('guts', __name__, url_prefix='')
app = bp

@app.route('/api/guts', methods=['GET'])
def get_guts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""SELECT * FROM guts_constants ORDER BY year DESC, division""")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)

@app.route('/api/park_factors', methods=['GET'])
def get_pf():
    division = request.args.get('division', default=3, type=int)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"""SELECT * FROM park_factors WHERE division = ?""", (division,))
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/expected_runs', methods=['GET'])
def get_expected_runs():
    year = request.args.get('year', 'MAX_YEAR')
    division = request.args.get('division', default=3, type=int)

    try:
        year = int(year)
        if not (MIN_YEAR <= year <= MAX_YEAR):
            return jsonify({"error": "Invalid year. Must be between MIN_YEAR and MAX_YEAR."}), 400

        if not (1 <= division <= 3):
            return jsonify({"error": "Invalid division. Must be between 1 and 3."}), 400
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM expected_runs
        WHERE division = ? AND year = ?
    """, (division, year))

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)
