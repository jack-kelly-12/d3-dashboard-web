from flask import Blueprint, jsonify, request
import logging
import json
import re
import sqlite3
from db import get_db_connection
from config import MIN_YEAR, MAX_YEAR

bp = Blueprint('player_data', __name__, url_prefix='/api')
app = bp

@app.route('/rolling/<string:player_id>', methods=['GET'])
def get_player_rolling_data(player_id):
    window = request.args.get('window', type=int, default=25)
    player_type = request.args.get('player_type', default='batter')

    if window < 1:
        return jsonify({"error": "Window size must be at least 1."}), 400
    if player_type.lower() not in ['batter', 'pitcher']:
        return jsonify({"error": "Invalid player_type. Must be 'batter' or 'pitcher'."}), 400

    id_field = "batter_id" if player_type.lower() == 'batter' else "pitcher_id"

    conn = get_db_connection()
    conn.create_function("round", 2, round)
    cursor = conn.cursor()

    try:
        check_query = f"""
            SELECT COUNT(*) 
            FROM pbp
            WHERE {id_field} = ?
            AND woba IS NOT NULL
        """

        cursor.execute(check_query, (player_id,))
        data_count = cursor.fetchone()[0]

        if data_count == 0:
            return jsonify({
                "error": f"No wOBA data found for {player_type} with ID {player_id}",
                "player_type": player_type,
                "id_field": id_field
            }), 404

        if data_count < window:
            return jsonify({
                "error": f"Not enough plate appearances for window size {window}. Player has {data_count} PAs.",
                "player_type": player_type,
                "total_pas": data_count
            }), 400

        query = f"""
            WITH player_pas AS (
                SELECT 
                    date,
                            contest_id,
                    woba,
                    ROW_NUMBER() OVER (
                        ORDER BY 
                                    substr(date, 7, 4), -- year part (YYYY)
                            substr(date, 1, 2), -- Month part (MM)
                            substr(date, 4, 2), -- Day part (DD)
                                    contest_id
                    ) as pa_number
                FROM pbp
                WHERE {id_field} = ?
                AND woba IS NOT NULL
                ORDER BY 
                substr(date, 7, 4), -- year part (YYYY)
        substr(date, 1, 2), -- Month part (MM)
        substr(date, 4, 2), -- Day part (DD)
                contest_id
        ),
        rolling_window AS (
            SELECT 
                p1.pa_number,
                p1.date as game_date,
                round(AVG(p2.woba), 3) as rolling_woba,
                p1.woba as raw_woba_value,
                COUNT(p2.woba) as window_size
            FROM player_pas p1
            JOIN player_pas p2 ON 
                p2.pa_number <= p1.pa_number AND 
                p2.pa_number > p1.pa_number - ?
            GROUP BY p1.pa_number, p1.date, p1.woba
            ORDER BY p1.pa_number
        )
        SELECT * FROM rolling_window
        WHERE window_size >= ?
        """

        cursor.execute(query, (player_id, window, window))

        rolling_data = []
        for row in cursor.fetchall():
            rolling_data.append({
                'pa_number': row[0],
                'game_date': row[1],
                'rolling_woba': row[2],
                'raw_woba_value': row[3],
                'window_size': row[4]
            })

        career_query = f"""
        SELECT round(AVG(woba), 3) as career_woba
        FROM pbp
        WHERE {id_field} = ?
        AND woba IS NOT NULL
        """

        cursor.execute(career_query, (player_id,))
        career_woba = cursor.fetchone()[0]

        count_query = f"""
        SELECT COUNT(*) 
        FROM pbp
        WHERE {id_field} = ?
        AND woba IS NOT NULL
        """

        cursor.execute(count_query, (player_id,))
        total_pas = cursor.fetchone()[0]

        return jsonify({
            "rolling_data": rolling_data,
            "window": window,
            "total_pas": total_pas,
            "career_woba": career_woba,
            "player_type": player_type
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "error": f"Error: {str(e)}",
            "player_type": player_type,
            "id_field": id_field,
            "player_id": player_id
        }), 500
    finally:
        conn.close()


@app.route('/similar-batters/<string:player_id>', methods=['GET'])
def get_similar_batters(player_id):
    year = request.args.get('year', type=int, default=MAX_YEAR)
    division = request.args.get('division', type=int, default=3)
    count = request.args.get('count', type=int, default=5)

    if year < MIN_YEAR or year > MAX_YEAR:
        return jsonify({"error": "Invalid year. Must be between MIN_YEAR and MAX_YEAR."}), 400

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            WITH target_metrics AS (
                SELECT 
                    b.player_name,
                    b.team_name,
                    b.war,
                    b.pa,
                    b.hr,
                    b.k,
                    b.bb,
                    b.woba,
                    b.ob_pct + b.slg_pct as ops,
                    COALESCE(bb.gb_pct, 0) as gb_pct,
                    COALESCE(bb.fb_pct, 0) as fb_pct,
                    COALESCE(bb.ld_pct, 0) as ld_pct,
                    COALESCE(bb.pull_pct, 0) as pull_pct
                FROM batting b
                LEFT JOIN batted_ball bb ON b.player_id = bb.player_id AND b.year = bb.year AND b.division = bb.division
                WHERE b.player_id = ? AND b.year = ? AND b.division = ?
                LIMIT 1
            ),
            similar_players AS (
                SELECT 
                    b.player_id,
                    b.player_name,
                    b.team_name,
                    b.year,
                    r.org_id as org_id,
                    b.war,
                    b.pa,
                    b.hr,
                    b.k,
                    b.bb,
                    b.woba,
                    b.ob_pct + b.slg_pct as ops,
                    COALESCE(bb.gb_pct, 0) as gb_pct,
                    COALESCE(bb.fb_pct, 0) as fb_pct,
                    COALESCE(bb.ld_pct, 0) as ld_pct,
                    COALESCE(bb.pull_pct, 0) as pull_pct,
                    -- Calculate similarity score (higher is better)
                    (
                        5 * (1 - ABS(b.woba - (SELECT woba FROM target_metrics))) +
                        3 * (1 - ABS((b.ob_pct + b.slg_pct) - (SELECT ops FROM target_metrics)) / 2.0) +
                        2 * (1 - ABS(COALESCE(bb.gb_pct, 0) - (SELECT gb_pct FROM target_metrics)) / 100.0) +
                        2 * (1 - ABS(COALESCE(bb.fb_pct, 0) - (SELECT fb_pct FROM target_metrics)) / 100.0) +
                        1 * (1 - ABS(COALESCE(bb.pull_pct, 0) - (SELECT pull_pct FROM target_metrics)) / 100.0)
                    ) as similarity_score
                FROM batting b
                LEFT JOIN batted_ball bb ON b.player_id = bb.player_id AND b.year = bb.year AND b.division = bb.division
                LEFT JOIN rosters r ON b.player_id = r.player_id AND b.year = r.year AND b.division = r.division
                WHERE b.division = ? 
                    AND b.pa >= 50
                    AND b.player_id != ?
            )
            SELECT 
                player_id,
                player_name,
                team_name,
                org_id,
                year,
                ROUND(war, 1) as war,
                pa,
                hr,
                k,
                bb,
                ROUND(woba, 3) as woba,
                ROUND(ops, 3) as ops,
                ROUND(similarity_score * 100, 1) as similarity_score
            FROM similar_players
            ORDER BY similarity_score DESC
            LIMIT ?
        """, (player_id, year, division, division, player_id, count))

        results = [dict(row) for row in cursor.fetchall()]

        if not results:
            return jsonify({"error": "Player not found or no similar players available"}), 404

        cursor.execute("""
            SELECT player_name, team_name
            FROM batting 
            WHERE player_id = ? AND year = ? AND division = ?
            LIMIT 1
        """, (player_id, year, division))
        
        target_info = cursor.fetchone()
        target_name = target_info['player_name'] if target_info else "Unknown"

        return jsonify({
            'target_player': {
                'player_id': player_id,
                'player_name': target_name,
                'year': year
            },
            'similar_players': results,
            'note': f"Similar players from all years based on {target_name}'s {year} performance"
        })

    except sqlite3.Error as e:
        logging.error(f"Database error in get_similar_batters: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/similar-pitchers/<string:player_id>', methods=['GET'])
def get_similar_pitchers(player_id):
    year = request.args.get('year', type=int, default=MAX_YEAR)
    division = request.args.get('division', type=int, default=3)
    count = request.args.get('count', type=int, default=5)

    if year < MIN_YEAR or year > MAX_YEAR:
        return jsonify({"error": "Invalid year. Must be between MIN_YEAR and MAX_YEAR."}), 400

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            WITH target_metrics AS (
            SELECT 
                p.player_name,
                    p.team_name,
                    p.era,
                    p.fip,
                    p.xfip,
                    p.k_pct,
                    p.bb_pct,
                    p.k_minus_bb_pct,
                    p.hr_div_fb,
                    p.war,
                    p.ip,
                    p.ra9,
                    p.pwpa,
                    p.pwpa_li,
                    p.prea,
                    p.clutch
            FROM pitching p
            WHERE p.player_id = ? AND p.year = ? AND p.division = ?
            LIMIT 1
            ),
            similar_players AS (
                SELECT 
                    p.player_id,
                    p.player_name, 
                    p.team_name,
                    p.year,
                    r.org_id as org_id,
                    p.era,
                    p.fip,
                    p.xfip,
                    p.k_pct,
                    p.bb_pct,
                    p.k_minus_bb_pct,
                    p.hr_div_fb,
                    p.war,
                    p.ip,
                    p.ra9,
                    p.pwpa,
                    p.pwpa_li,
                    p.prea,
                    p.clutch,
                    -- Calculate similarity score (higher is better)
                    (
                        5 * (1 - ABS(p.era - (SELECT era FROM target_metrics)) / 10.0) +
                        5 * (1 - ABS(p.fip - (SELECT fip FROM target_metrics)) / 5.0) +
                        4 * (1 - ABS(p.k_pct - (SELECT k_pct FROM target_metrics)) / 50.0) +
                        4 * (1 - ABS(p.bb_pct - (SELECT bb_pct FROM target_metrics)) / 20.0) +
                        3 * (1 - ABS(p.k_minus_bb_pct - (SELECT k_minus_bb_pct FROM target_metrics)) / 30.0) +
                        2 * (1 - ABS(p.hr_div_fb - (SELECT hr_div_fb FROM target_metrics)) / 20.0)
                    ) as similarity_score
                FROM pitching p
                LEFT JOIN rosters r ON p.player_id = r.player_id AND p.year = r.year AND p.division = r.division
                WHERE p.division = ? 
                    AND p.ip >= 50
                    AND p.player_id != ?
            )
            SELECT 
                player_id,
                player_name,
                team_name,
                org_id,
                year,
                ROUND(era, 2) as era,
                ROUND(fip, 2) as fip,
                ROUND(xfip, 2) as xfip,
                ROUND(k_pct, 1) as k_pct,
                ROUND(bb_pct, 1) as bb_pct,
                ROUND(k_minus_bb_pct, 1) as k_minus_bb_pct,
                ROUND(hr_div_fb, 1) as hr_div_fb,
                ROUND(war, 1) as war,
                ROUND(ip, 1) as ip,
                ROUND(ra9, 2) as ra9,
                ROUND(pwpa, 2) as pwpa,
                ROUND(pwpa_li, 2) as pwpa_li,
                ROUND(prea, 2) as prea,
                ROUND(clutch, 2) as clutch,
                ROUND(similarity_score * 100, 1) as similarity_score
            FROM similar_players
            ORDER BY similarity_score DESC
            LIMIT ?
        """, (player_id, year, division, division, player_id, count))

        results = [dict(row) for row in cursor.fetchall()]

        if not results:
            return jsonify({"error": "Player not found or no similar players available"}), 404

        cursor.execute("""
            SELECT player_name, team_name
            FROM pitching 
            WHERE player_id = ? AND year = ? AND division = ?
            LIMIT 1
        """, (player_id, year, division))
        
        target_info = cursor.fetchone()
        target_name = target_info['player_name'] if target_info else "Unknown"

        return jsonify({
            'target_player': {
                'player_id': player_id,
                'player_name': target_name,
                'year': year
            },
            'similar_players': results,
            'note': f"Similar players from all years based on {target_name}'s {year} performance"
        })

    except sqlite3.Error as e:
        logging.error(f"Database error in get_similar_pitchers: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/player-years/<string:player_id>/<int:division>', methods=['GET'])
def get_player_years(player_id, division):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT DISTINCT year 
            FROM batting 
            WHERE player_id = ? AND division = ? AND pa > 25
            ORDER BY year DESC
        """, (player_id, division))
        batting_years = [row[0] for row in cursor.fetchall()]
        
        cursor.execute("""
            SELECT DISTINCT year 
            FROM pitching 
            WHERE player_id = ? AND division = ? AND ip > 10
            ORDER BY year DESC
        """, (player_id, division))
        pitching_years = [row[0] for row in cursor.fetchall()]
        
        return jsonify({
            "batting_years": batting_years,
            "pitching_years": pitching_years,
            "most_recent_batting": batting_years[0] if batting_years else None,
            "most_recent_pitching": pitching_years[0] if pitching_years else None
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route('/spraychart_data/<player_id>', methods=['GET'])
def get_spraychart_data(player_id):
    try:
        year = int(request.args.get('year', 'MAX_YEAR'))    
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    FIELD_PATTERNS = {
        "to_lf": [r'to left', r'to lf', r'left field', r'lf line', r'by lf'],
        "to_cf": [r'to center', r'to cf', r'center field', r'by cf'],
        "to_rf": [r'to right', r'to rf', r'right field', r'rf line', r'by rf'],
        "to_lf_hr": [r'homered to left', r'homered to lf', r'homers to lf', r'homers to left'],
        "to_cf_hr": [r'homered to center', r'homered to cf', r'homers to cf', r'homers to center'],
        "to_rf_hr": [r'homered to right', r'homered to rf', r'homers to rf', r'homers to right'],
        "to_3b": [r'to 3b', r'to third', r'third base', r'3b line', r'by 3b', r'3b to 2b'],
        "to_ss": [r'ss to 2b', r'to ss', r'to short', r'shortstop', r'by ss'],
        "up_middle": [r'up the middle', r'to pitcher', r'to p', r'to c', r'by p', r'by c', r'to pitcher', r'to catcher'],
        "to_2b": [r'2b to ss', r'to 2b', r'to second', r'second base', r'by 2b'],
        "to_1b": [r'to 1b', r'to first', r'first base', r'1b line', r'by 1b', r'1b to ss', r'1b to p', r'1b to 2b'],
    }

    hit_counts = {location: 0 for location in FIELD_PATTERNS.keys()}

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT r.player_name, r.team_name, r.bats 
            FROM rosters r
            WHERE r.player_id = ? AND r.year = ?    
            LIMIT 1
        """, (player_id, year))

        player_info = cursor.fetchone()
        if not player_info:
            return jsonify({"error": f"Player not found for ID {player_id} in year {year}"}), 404

        player_info_dict = dict(player_info)
        player_name = player_info_dict["player_name"]
        team_name = player_info_dict["team_name"]
        bats = player_info_dict.get("bats", "R")

        cursor.execute("""
            SELECT 
                p.description,
                p.pitcher_id,
                p.woba,
                p.division,
                p.year,
                rp.throws as pitcher_throws
            FROM pbp p
            LEFT JOIN rosters rp
                ON p.pitcher_id = rp.player_id
                AND p.year = rp.year
                AND p.division = rp.division
            WHERE p.batter_id = ? AND p.year = ? 
        """, (player_id, year))

        pbp_rows = cursor.fetchall()
        pbp_data = [dict(row) for row in pbp_rows]

        compiled_patterns = {}
        for location, patterns in FIELD_PATTERNS.items():
            compiled_patterns[location] = [re.compile(pattern, re.IGNORECASE) for pattern in patterns]

        bb_type_patterns = {
            'is_ground': re.compile(r"ground|fielder's choice|reached on error|through the (left|right) side|down the", re.IGNORECASE),
            'is_fly': re.compile(r"fly|flied|homered to", re.IGNORECASE),
            'is_lined': re.compile(r"lined|doubled", re.IGNORECASE),
            'is_popped': re.compile(r"popped|fouled out", re.IGNORECASE),
        }

        def classify_zone(description: str):
            for location, patterns in compiled_patterns.items():
                if any(p.search(description) for p in patterns):
                    return location
            return None

        def map_zone_to_display(zone_key: str):
            if zone_key in ("to_lf", "to_lf_hr"):
                return "left-field" if zone_key == "to_lf" else "left-field-hr"
            if zone_key in ("to_cf", "to_cf_hr"):
                return "center-field" if zone_key == "to_cf" else "center-field-hr"
            if zone_key in ("to_rf", "to_rf_hr"):
                return "right-field" if zone_key == "to_rf" else "right-field-hr"
            if zone_key == "to_3b":
                return "third-base"
            if zone_key == "to_ss":
                return "shortstop"
            if zone_key == "to_2b":
                return "second-base"
            if zone_key == "to_1b":
                return "first-base"
            if zone_key == "up_middle":
                return "up-the-middle"
            return None

        events = []
        for play in pbp_data:
            desc = (play.get('description') or '').lower().split('3a')[0]
            if not desc:
                continue

            zone_key = None
            hr_found = False
            for location, patterns in compiled_patterns.items():
                if "_hr" in location and any(p.search(desc) for p in patterns):
                    zone_key = location
                    hr_found = True
                    break
            if not hr_found:
                zone_key = classify_zone(desc)

            display_zone = map_zone_to_display(zone_key) if zone_key else None
            
            is_hr = 'homered' in desc
            if is_hr and display_zone and not display_zone.endswith("-hr"):
                display_zone = display_zone + "-hr"

            is_ground = bool(bb_type_patterns['is_ground'].search(desc))
            is_fly = bool(bb_type_patterns['is_fly'].search(desc))
            is_lined = bool(bb_type_patterns['is_lined'].search(desc))
            is_popped = bool(bb_type_patterns['is_popped'].search(desc))

            # Derive spray direction from the classified zone and batter hand.
            # This is more robust than parsing the raw description text and
            # ensures direction stats populate consistently for the scouting chart.
            def compute_direction_from_zone(z_key: str, batter_hand: str):
                if not z_key or not batter_hand or batter_hand == '-':
                    return None
                hand = batter_hand.lower()[0]
                # Middle includes both straight-away CF and balls up the middle
                if z_key in ("to_cf", "to_cf_hr", "up_middle"):
                    return "middle"
                if hand == 'r':
                    if z_key in ("to_lf", "to_lf_hr"):
                        return "pull"
                    if z_key in ("to_rf", "to_rf_hr"):
                        return "oppo"
                if hand == 'l':
                    if z_key in ("to_rf", "to_rf_hr"):
                        return "pull"
                    if z_key in ("to_lf", "to_lf_hr"):
                        return "oppo"
                return None

            direction = compute_direction_from_zone(zone_key, bats)

            is_single = 'singled' in desc
            is_double = 'doubled' in desc
            is_triple = 'tripled' in desc
            is_bb = 'walked' in desc or 'intentional walk' in desc
            is_hbp = 'hit by pitch' in desc
            is_sf = 'sacrifice fly' in desc

            if zone_key:
                if zone_key in hit_counts:
                    hit_counts[zone_key] += 1

            events.append({
                'description': play.get('description'),
                'pitcher_id': play.get('pitcher_id'),
                'pitcher_throws': play.get('pitcher_throws'),
                'woba': play.get('woba'),
                'zone_key': zone_key,
                'field_zone': display_zone,
                'is_ground': is_ground,
                'is_fly': is_fly,
                'is_lined': is_lined,
                'is_popped': is_popped,
                'direction': direction,
                'is_single': is_single,
                'is_double': is_double,
                'is_triple': is_triple,
                'is_hr': is_hr,
                'is_bb': is_bb,
                'is_hbp': is_hbp,
                'is_sf': is_sf,
                'is_pa': play.get('woba') is not None,
            })

        cursor.execute("""
            SELECT DISTINCT p.year
            FROM pbp p
            WHERE p.batter_id = ?
            ORDER BY p.year DESC
        """, (player_id,))
        available_years = [row['year'] for row in cursor.fetchall()]

        response_data = {
            "counts": hit_counts,
            "player_id": player_id,
            "player_name": player_name,
            "team_name": team_name,
            "bats": bats,
            "year": year,
            "events": events,
            "available_years": available_years,
        }

        return jsonify(response_data)

    except Exception as e:
        logging.error(f"Error in get_spraychart_data: {str(e)}", exc_info=True)
        return jsonify({"error": "An internal server error occurred"}), 500
    finally:
        if conn:
            conn.close()


@app.route('/player/<string:player_id>', methods=['GET'])
def get_player_stats(player_id):
    """
    Player profile
    ---
    tags:
      - Players
    parameters:
      - in: path
        name: player_id
        schema: { type: string }
        required: true
    responses:
      200:
        description: Player profile and stats
      404:
        description: Player not found
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT 
                r.player_name,
                r.team_name,
                r.division,
                r.conference,
                r.org_id,
                r.height,
                r.bats,
                r.throws,
                r.hometown,
                r.high_school,
                r.position,
                r.year,
                r.img_url as headshot_url
            FROM rosters r
            WHERE r.player_id = ?
            ORDER BY r.year DESC
            LIMIT 1
        """, (player_id,))
        
        player_info = cursor.fetchone()
        if not player_info:
            return jsonify({"error": "Player not found"}), 404

        player_info_dict = dict(player_info)
        current_year = player_info_dict['year']

        cursor.execute("""
            SELECT 
                b.*,
                r.org_id,
                r.img_url as headshot_url
            FROM batting b
            LEFT JOIN rosters r ON b.player_id = r.player_id AND b.year = r.year AND b.division = r.division
            WHERE b.player_id = ?
            ORDER BY b.year DESC
        """, (player_id,))
        
        batting_stats = [dict(row) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT 
                p.*,
                r.org_id,
                r.img_url as headshot_url
            FROM pitching p
            LEFT JOIN rosters r ON p.player_id = r.player_id AND p.year = r.year AND p.division = r.division
            WHERE p.player_id = ?
            ORDER BY p.year DESC
        """, (player_id,))
        
        pitching_stats = [dict(row) for row in cursor.fetchall()]

        is_pitcher = len(pitching_stats) > 0
        is_active = current_year == MAX_YEAR

        return jsonify({
            "player_id": player_id,
            "headshot_url": player_info_dict["headshot_url"],
            "player_name": player_info_dict["player_name"],
            "current_team": player_info_dict["team_name"],
            "conference": player_info_dict["conference"],
            "division": player_info_dict["division"],
            "org_id": player_info_dict["org_id"],
            "is_pitcher": is_pitcher,
            "is_active": is_active,
            "height": player_info_dict["height"],
            "bats": player_info_dict["bats"],
            "throws": player_info_dict["throws"],
            "hometown": player_info_dict["hometown"],
            "high_school": player_info_dict["high_school"],
            "position": player_info_dict["position"],
            "batting_stats": batting_stats,
            "pitching_stats": pitching_stats
        })

    except sqlite3.Error as e:
        logging.error(f"Database error in get_player_stats: {e}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        logging.error(f"Error fetching player stats: {e}")
        return jsonify({"error": "Failed to fetch player statistics"}), 500
    finally:
        conn.close()

@app.route('/search/players', methods=['GET'])
def search_players():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        search_term = f"%{query.lower()}%"

        cursor.execute("""
            WITH ranked AS (
                SELECT 
                    r.player_id, 
                    r.player_name AS playerName, 
                    r.team_name AS team, 
                    r.conference,
                    CASE 
                        WHEN LOWER(r.player_name) = LOWER(?) THEN 1
                        WHEN LOWER(r.player_name) LIKE LOWER(?) || '%' THEN 2
                        ELSE 3
                    END AS match_rank
                FROM rosters r
                INNER JOIN (
                    SELECT player_id, MAX(year) AS latest_year
                    FROM rosters
                    GROUP BY player_id
                ) latest ON latest.player_id = r.player_id AND latest.latest_year = r.year
                WHERE LOWER(r.player_name) LIKE ?
                GROUP BY r.player_id
            )
            SELECT player_id, playerName, team, conference
            FROM ranked
            ORDER BY match_rank, playerName
            LIMIT 8;
        """, (query, query, search_term))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": "An error occurred while searching players"}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/players')
def get_players():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            WITH LatestPlayeryear AS (
                SELECT 
                    player_id, 
                    MAX(year) as latest_year
                FROM rosters
                GROUP BY player_id
            )
            SELECT 
                r1.player_id, 
                r1.player_name,
                r2.position,
                r2.team_name,
                r2.conference,
                r2.division,
                MIN(r1.year) as min_year,
                MAX(r1.year) as max_year,
                JSON_GROUP_ARRAY(DISTINCT r1.year) as years
            FROM rosters r1
            LEFT JOIN (
                SELECT r.player_id, r.team_name, r.conference, r.division, r.year, r.position
                FROM rosters r
                JOIN LatestPlayeryear lpy ON r.player_id = lpy.player_id AND r.year = lpy.latest_year
            ) r2 ON r1.player_id = r2.player_id
            GROUP BY r1.player_id
            ORDER BY r1.player_name
        """)

        players = []
        for row in cursor.fetchall():
            player_dict = dict(row)

            if player_dict.get('position'):
                player_dict['position'] = player_dict['position'].upper()

            try:
                if isinstance(player_dict.get('years'), str):
                    player_dict['years'] = json.loads(player_dict['years'])
            except:
                player_dict['years'] = [
                    player_dict['min_year'], player_dict['max_year']]

            players.append(player_dict)

        return jsonify(players)

    except Exception as e:
        print(f"Error fetching players: {e}")
        return jsonify({"error": f"Failed to fetch players: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/player-percentiles/<string:player_id>/<int:year>/<int:division>', methods=['GET'])
def get_player_percentiles(player_id, year, division):
    conn = get_db_connection()
    cursor = conn.cursor()
    response = {"batting": None, "pitching": None}
    conference_filter = request.args.get('conference')

    def rows_to_dicts(rows, desc):
        cols = [d[0] for d in desc]
        return [dict(zip(cols, r)) for r in rows]

    EPS = 1e-9

    def compute_percentiles(pop_rows, player_row, stats, reverse_stats):
        out = {}
        
        for stat in stats:
            vals = []
            for r in pop_rows:
                val = r.get(stat)
                if val is not None:
                    try:
                        vals.append(float(val))
                    except (ValueError, TypeError):
                        continue
            
            pv = player_row.get(stat)
            if not vals or pv is None:
                continue
            
            try:
                pv = float(pv)
            except (ValueError, TypeError):
                continue

            vals.sort()
            n = len(vals)
            
            if stat in reverse_stats:
                worse = sum(1 for v in vals if v > pv + EPS)
                equal = sum(1 for v in vals if abs(v - pv) <= EPS)
            else:
                worse = sum(1 for v in vals if v < pv - EPS) 
                equal = sum(1 for v in vals if abs(v - pv) <= EPS)

            pct = (worse + 0.5 * equal) / n * 100.0
            out[f"{stat}_percentile"] = int(round(pct))
            out[stat] = pv
        return out

    def compute_rankings(pop_rows, player_row, stats, reverse_stats):
        out = {}
        for stat in stats:
            vals = []
            for r in pop_rows:
                val = r.get(stat)
                if val is not None:
                    try:
                        vals.append(float(val))
                    except (ValueError, TypeError):
                        continue
            
            pv = player_row.get(stat)
            if not vals or pv is None:
                continue
            
            try:
                pv = float(pv)
            except (ValueError, TypeError):
                continue

            if stat in reverse_stats:
                better = sum(1 for v in vals if v < pv - EPS)
                equal = sum(1 for v in vals if abs(v - pv) <= EPS)
            else:
                better = sum(1 for v in vals if v > pv + EPS)
                equal = sum(1 for v in vals if abs(v - pv) <= EPS)

            rank = 1 + better + max(0, (equal - 1)) / 2.0
            out[f"{stat}_rank"] = int(round(rank))
        return out

    try:
        player_conference = None
        cursor.execute(
            """
            SELECT conference
            FROM rosters
            WHERE player_id = ? AND division = ? AND year = ?
            LIMIT 1
            """,
            (player_id, division, year),
        )
        row = cursor.fetchone()
        if row:
            player_conference = row[0]

        target_conference = None
        if conference_filter in ('auto', 'conference'):
            target_conference = player_conference
        elif conference_filter and conference_filter not in ('auto', 'conference'):
            target_conference = conference_filter

        batting_select = '''
            player_id,
            ba, ob_pct, slg_pct, woba,
            (ob_pct + slg_pct) AS ops,
            batting, baserunning, wpa, war, pa, wrc_plus, rea,
            k_pct, bb_pct, wpa_li
        '''
        pitching_select = '''
            player_id,
            era, fip, xfip,
            k_pct, bb_pct, k_minus_bb_pct,
            hr_div_fb,
            war, ip, ra9,
            pwpa, prea, pwpa_li
        '''

        cursor.execute(
            f"""
            SELECT {batting_select}
            FROM batting
            WHERE player_id = ? AND division = ? AND year = ?
            """,
            (player_id, division, year),
        )
        player_batting_row = cursor.fetchone()
        
        if not player_batting_row:
            cursor.execute(
                f"""
                SELECT {batting_select}
                FROM batting
                WHERE player_id = ? AND division = ? AND pa > 25
                ORDER BY year DESC
                LIMIT 1
                """,
                (player_id, division),
            )
            player_batting_row = cursor.fetchone()
        
        if player_batting_row:
            player_batting = dict(zip([d[0] for d in cursor.description], player_batting_row))

            params = [division, year]
            where = "pa > 25 AND division = ? AND year = ?"
            if target_conference:
                where += " AND conference = ?"
                params.append(target_conference)

            cursor.execute(
                f"SELECT {batting_select} FROM batting WHERE {where} ORDER BY pa",
                params,
            )
            all_pop_rows = rows_to_dicts(cursor.fetchall(), cursor.description)

            pop_rows = [r for r in all_pop_rows if r.get('player_id') != player_id]

            batting_stats = [
                'ba', 'ob_pct', 'slg_pct', 'woba', 'ops',
                'batting', 'baserunning', 'wpa', 'war', 'wrc_plus', 'rea',
                'k_pct', 'bb_pct', 'wpa_li'
            ]
            batting_reverse = {'k_pct'}

            percentiles = compute_percentiles(pop_rows, player_batting, batting_stats, batting_reverse)
            rankings = compute_rankings(pop_rows, player_batting, batting_stats, batting_reverse)
            combined_stats = {**percentiles, **rankings}

            response["batting"] = {
                "type": "batting",
                "stats": combined_stats,
                "qualified": (player_batting.get('pa') or 0) > 25,
                "pa_threshold": 25,
                "player_pa": player_batting.get('pa'),
                "year": year,
                "division": division,
                "conference": target_conference,
                "is_conference_filtered": bool(target_conference),
                "player_count": len(all_pop_rows),
            }

        cursor.execute(
            f"""
            SELECT {pitching_select}
            FROM pitching
            WHERE player_id = ? AND division = ? AND year = ?
            """,
            (player_id, division, year),
        )
        player_pitching_row = cursor.fetchone()
        
        if not player_pitching_row:
            cursor.execute(
                f"""
                SELECT {pitching_select}
                FROM pitching
                WHERE player_id = ? AND division = ? AND ip > 10
                ORDER BY year DESC
                LIMIT 1
                """,
                (player_id, division),
            )
            player_pitching_row = cursor.fetchone()
        
        if player_pitching_row:
            player_pitching = dict(zip([d[0] for d in cursor.description], player_pitching_row))

            params = [division, year]
            where = "ip > 10 AND division = ? AND year = ?"
            if target_conference:
                where += " AND conference = ?"
                params.append(target_conference)

            cursor.execute(
                f"SELECT {pitching_select} FROM pitching WHERE {where} ORDER BY ip",
                params,
            )
            all_pop_rows = rows_to_dicts(cursor.fetchall(), cursor.description)

            pop_rows = [r for r in all_pop_rows if r.get('player_id') != player_id]

            pitching_stats = [
                'era', 'fip', 'xfip',
                'k_pct', 'bb_pct', 'k_minus_bb_pct',
                'ra9', 'war', 'prea', 'pwpa', 'pwpa_li', 'hr_div_fb'
            ]
            pitching_reverse = {'era', 'fip', 'xfip', 'bb_pct', 'ra9', 'hr_div_fb'}

            percentiles = compute_percentiles(pop_rows, player_pitching, pitching_stats, pitching_reverse)
            rankings = compute_rankings(pop_rows, player_pitching, pitching_stats, pitching_reverse)
            combined_stats = {**percentiles, **rankings}

            response["pitching"] = {
                "type": "pitching",
                "stats": combined_stats,
                "qualified": (player_pitching.get('ip') or 0) > 10,
                "ip_threshold": 10,
                "player_ip": player_pitching.get('ip'),
                "year": year,
                "division": division,
                "conference": target_conference,
                "is_conference_filtered": bool(target_conference),
                "player_count": len(all_pop_rows),
            }

        if response["batting"] is None and response["pitching"] is None:
            return jsonify({
                "inactive": True,
                "message": f"Player not active in {year} season for division {division}"
            })

        return jsonify(response)
    finally:
        conn.close()