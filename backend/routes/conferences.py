from flask import Blueprint, jsonify, request
from config import MIN_YEAR, MAX_YEAR
from db import get_db_connection
from middleware import require_api_auth


bp = Blueprint('conferences', __name__, url_prefix='/api')


@bp.get('/conferences')
@require_api_auth
def get_conferences():
    """
    Get list of conferences
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
        name: years
        schema:
          type: string
        description: Single year or comma-separated years
    responses:
      200:
        description: List of conference names
      400:
        description: Invalid parameters
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    division = request.args.get('division', default=3, type=int)
    years_param = request.args.get('years', str(MAX_YEAR))

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3"}), 400

    try:
        if ',' in years_param:
            years = [int(y.strip()) for y in years_param.split(',')]
        else:
            years = [int(years_param)]

        for year in years:
            if year < MIN_YEAR or year > MAX_YEAR:
                return jsonify({"error": f"Invalid year {year}. Must be between MIN_YEAR and MAX_YEAR."}), 400

        placeholders = ','.join(['?' for _ in years])
        query = f"""
            SELECT DISTINCT conference
            FROM rosters
            WHERE division = ? AND year IN ({placeholders}) AND conference IS NOT NULL
            ORDER BY conference
        """

        cursor.execute(query, [division] + years)

        conferences = [row[0] for row in cursor.fetchall()]

        if not conferences:
            return jsonify([])

        return jsonify(conferences)

    except ValueError:
        return jsonify({"error": "Invalid years format. Use single year or comma-separated list (e.g., '2024' or '2023,2024,MAX_YEAR')"}), 400
    except Exception as e:
        print(f"Error fetching conferences: {e}")
        return jsonify({"error": "Failed to fetch conferences"}), 500

    finally:
        cursor.close()
        conn.close()


