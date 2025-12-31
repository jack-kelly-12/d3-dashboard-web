from flask import Blueprint, jsonify, request
from config import MIN_YEAR, MAX_YEAR
from db import get_db_connection
from middleware import require_api_auth, cache_response


bp = Blueprint('batting', __name__, url_prefix='/api')


@bp.get('/batting')
@require_api_auth
@cache_response(ttl=300)
def get_batting():
    """
    Get batting leaderboard
    ---
    tags:
      - Batting
    description: |
      Returns individual player batting statistics with advanced metrics.

      **Returned fields include:**
      - Basic: PA, AB, H, 1B, 2B, 3B, HR, R, RBI, BB, SO, SB, CS
      - Rates: AVG, OBP, SLG, OPS, ISO, BABIP, K%, BB%, HR%
      - Advanced: wOBA, wRC, wRC+, wRAA, WAR, SOS-adjusted WAR
      - Percentiles: war_percentile, sos_adj_war_percentile

      ### Python Example

      ```python
      import requests
      import pandas as pd

      API_KEY = "YOUR_API_KEY"
      BASE_URL = "https://d3-dashboard.com/api"

      # Get D3 batting leaders for 2024
      response = requests.get(
          f"{BASE_URL}/batting",
          headers={"X-API-Key": API_KEY},
          params={"years": "2024", "division": 3}
      )

      data = response.json()
      df = pd.DataFrame(data)

      # Top 10 by WAR
      print(df.nlargest(10, "war")[["player_name", "team_name", "war", "woba", "wrc_plus"]])
      ```

      ### Multi-year Example

      ```python
      # Compare 2023 and 2024 seasons
      response = requests.get(
          f"{BASE_URL}/batting",
          headers={"X-API-Key": API_KEY},
          params={"years": "2023,2024", "division": 3}
      )

      df = pd.DataFrame(response.json())
      print(df.groupby("year")["war"].describe())
      ```

    parameters:
      - in: query
        name: years
        schema:
          type: string
        description: Single year or comma-separated years (e.g., "2024" or "2023,2024")
        example: "2024"
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        default: 3
        description: NCAA division (1, 2, or 3)
        example: 3
    responses:
      200:
        description: Array of player batting statistics with WAR percentiles
      400:
        description: Invalid parameters
    """
    years_param = request.args.get('years', str(MAX_YEAR))
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
@require_api_auth
@cache_response(ttl=300)
def get_batting_team():
    """
    Get team batting statistics
    ---
    tags:
      - Batting
    description: |
      Returns aggregated team-level batting statistics with advanced metrics.

      **Returned fields include:**
      - Counting: PA, AB, H, 2B, 3B, HR, R, RBI, BB, SO, SB, CS
      - Rates: AVG, OBP, SLG, OPS, ISO, BABIP, K%, BB%
      - Advanced: wOBA, wRC, wRC+, WAR, SOS-adjusted WAR
      - Percentiles: war_percentile, sos_adj_war_percentile

      ### Python Example

      ```python
      import requests
      import pandas as pd

      API_KEY = "YOUR_API_KEY"
      BASE_URL = "https://d3-dashboard.com/api"

      # Get D3 team batting for 2024
      response = requests.get(
          f"{BASE_URL}/batting_team",
          headers={"X-API-Key": API_KEY},
          params={"years": "2024", "division": 3}
      )

      teams = pd.DataFrame(response.json())

      # Top offensive teams by wRC+
      print(teams.nlargest(10, "wrc_plus")[["team_name", "wrc_plus", "war", "ops"]])
      ```

      ### Compare Conferences

      ```python
      # Conference batting comparison
      conf_stats = teams.groupby("conference").agg({
          "war": "sum",
          "wrc_plus": "mean",
          "ops": "mean"
      }).sort_values("war", ascending=False)

      print(conf_stats.head(10))
      ```

    parameters:
      - in: query
        name: years
        schema:
          type: string
        description: Single year or comma-separated years (e.g., "2024" or "2023,2024")
        example: "2024"
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        default: 3
        description: NCAA division (1, 2, or 3)
        example: 3
    responses:
      200:
        description: Array of team batting statistics with WAR percentiles
      400:
        description: Invalid parameters
    """
    years_param = request.args.get('years', str(MAX_YEAR))
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
        return jsonify({
            "error": "Invalid years format. Use single year or comma-separated list "
                     "(e.g., '2024' or '2023,2024')"
        }), 400

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


