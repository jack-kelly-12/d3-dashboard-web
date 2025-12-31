from flask import Blueprint, jsonify, request
from db import get_db_connection
from config import MIN_YEAR, MAX_YEAR
from middleware import require_api_auth

bp = Blueprint('guts', __name__, url_prefix='')
app = bp

@app.route('/api/guts', methods=['GET'])
@require_api_auth
def get_guts():
    """
    Get guts constants (wOBA weights, league averages)
    ---
    tags:
      - Reference
    description: |
      Returns league-wide constants used in advanced stat calculations, by year and division.
      These are the foundational values for computing wOBA, wRAA, wRC, and WAR.

      **Returned fields include:**
      - wOBA weights: wBB, wHBP, w1B, w2B, w3B, wHR
      - wOBA_scale: Scaling factor to normalize wOBA to OBP scale
      - lg_woba: League average wOBA
      - lg_r_pa: League runs per plate appearance
      - r_per_win: Runs required for one win (WAR denominator)
      - cFIP: FIP constant for the year/division

      ### Python Example

      ```python
      import requests
      import pandas as pd

      API_KEY = "YOUR_API_KEY"
      BASE_URL = "https://d3-dashboard.com/api"

      # Get all guts constants
      response = requests.get(
          f"{BASE_URL}/guts",
          headers={"X-API-Key": API_KEY}
      )

      guts = pd.DataFrame(response.json())

      # Filter to D3 2024
      d3_2024 = guts[(guts["division"] == 3) & (guts["year"] == 2024)]
      print(d3_2024[["woba_scale", "lg_woba", "r_per_win"]])
      ```

      ### Calculate wOBA Manually

      ```python
      # Using guts constants to calculate wOBA for a player
      g = d3_2024.iloc[0]

      # Example player stats
      bb, hbp, singles, doubles, triples, hr, ab, sf = 20, 2, 40, 10, 2, 5, 150, 3

      woba = (
          g["wbb"] * bb +
          g["whbp"] * hbp +
          g["w1b"] * singles +
          g["w2b"] * doubles +
          g["w3b"] * triples +
          g["whr"] * hr
      ) / (ab + bb - g.get("ibb", 0) + sf + hbp)

      print(f"Calculated wOBA: {woba:.3f}")
      ```

    responses:
      200:
        description: Array of guts constants by year and division
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""SELECT * FROM guts_constants ORDER BY year DESC, division""")
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)

@app.route('/api/park_factors', methods=['GET'])
@require_api_auth
def get_pf():
    """
    Get park factors by team
    ---
    tags:
      - Reference
    description: |
      Returns park factors for each team's home field. Park factors adjust
      offensive stats for the run-scoring environment of each ballpark.

      **Returned fields:**
      - team_name: Team identifier
      - pf: Overall park factor (100 = neutral, >100 = hitter-friendly)
      - division, year

      A park factor of 105 means the park increases run scoring by 5%.

      ### Python Example

      ```python
      import requests
      import pandas as pd

      API_KEY = "YOUR_API_KEY"
      BASE_URL = "https://d3-dashboard.com/api"

      # Get D3 park factors
      response = requests.get(
          f"{BASE_URL}/park_factors",
          headers={"X-API-Key": API_KEY},
          params={"division": 3}
      )

      pf = pd.DataFrame(response.json())

      # Most hitter-friendly parks
      print(pf.nlargest(10, "pf")[["team_name", "pf"]])

      # Most pitcher-friendly parks
      print(pf.nsmallest(10, "pf")[["team_name", "pf"]])
      ```

      ### Adjusting Stats for Park

      ```python
      # Adjust a player's wRC+ for park factor
      raw_wrc_plus = 125
      park_factor = 110  # Hitter-friendly park

      # Park-adjusted wRC+ (simplified)
      adjusted = raw_wrc_plus * (100 / park_factor)
      print(f"Park-adjusted wRC+: {adjusted:.1f}")
      ```

    parameters:
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        default: 3
        description: NCAA division
        example: 3
    responses:
      200:
        description: Array of park factors by team
      400:
        description: Invalid division
    """
    division = request.args.get('division', default=3, type=int)
    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""SELECT * FROM park_factors WHERE division = ?""", (division,))
    data = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)


@app.route('/api/expected_runs', methods=['GET'])
@require_api_auth
def get_expected_runs():
    """
    Get run expectancy matrix
    ---
    tags:
      - Reference
    description: |
      Returns the run expectancy matrix for each base-out state. This shows
      the average runs scored from each situation until the end of the inning.

      **Base-out states:** 24 total combinations (8 base states × 3 out states)
      - Bases: empty, 1st, 2nd, 3rd, 1st-2nd, 1st-3rd, 2nd-3rd, loaded
      - Outs: 0, 1, 2

      Used for calculating:
      - RE24 (run expectancy based on 24 base-out states)
      - WPA (win probability added)
      - Leverage Index

      ### Python Example

      ```python
      import requests
      import pandas as pd

      API_KEY = "YOUR_API_KEY"
      BASE_URL = "https://d3-dashboard.com/api"

      # Get D3 2024 run expectancy
      response = requests.get(
          f"{BASE_URL}/expected_runs",
          headers={"X-API-Key": API_KEY},
          params={"year": 2024, "division": 3}
      )

      re = pd.DataFrame(response.json())
      print(re)
      ```

      ### Format as Matrix

      ```python
      # Pivot to traditional RE24 matrix format
      re_matrix = re.pivot(index="outs", columns="base_state", values="expected_runs")
      print(re_matrix)

      # Example: Expected runs with runner on 2nd, 1 out
      runner_2nd_1out = re[(re["base_state"] == "020") & (re["outs"] == 1)]
      print(f"Expected runs: {runner_2nd_1out['expected_runs'].values[0]:.3f}")
      ```

    parameters:
      - in: query
        name: year
        schema:
          type: integer
        required: true
        description: Season year
        example: 2024
      - in: query
        name: division
        schema:
          type: integer
          enum: [1, 2, 3]
        default: 3
        description: NCAA division
        example: 3
    responses:
      200:
        description: Run expectancy for each of the 24 base-out states
      400:
        description: Invalid parameters
    """
    year = request.args.get('year', str(MAX_YEAR))
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
