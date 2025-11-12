from flask import Blueprint, jsonify, request
import logging
import sqlite3
from db import get_db_connection
from config import MIN_YEAR, MAX_YEAR

bp = Blueprint('leaderboards', __name__, url_prefix='/api/leaderboards')


@bp.get('/value')
def get_value_leaderboard():
    """
    Combined batting+pitching value leaderboard
    ---
    tags:
      - Leaderboards
    parameters:
      - in: query
        name: start_year
        schema: { type: integer }
      - in: query
        name: end_year
        schema: { type: integer }
      - in: query
        name: division
        schema: { type: integer, enum: [1,2,3] }
        default: 3
    responses:
      200:
        description: Leaderboard rows
      400:
        description: Invalid parameters
    """
    start_year = request.args.get('start_year', 'MAX_YEAR')
    end_year = request.args.get('end_year', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)

        if not (MIN_YEAR <= start_year <= MAX_YEAR) or not (MIN_YEAR <= end_year <= MAX_YEAR) or start_year > end_year:
            return jsonify({"error": "Invalid year range"}), 400
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            WITH batting_data AS (
                SELECT
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    pa,
                    war as batting_war,
                    wpa as batting_wpa,
                    wpa_li as batting_wpa_li,
                    rea as batting_rea,
                    clutch as batting_clutch
                FROM batting
                WHERE division = ? AND year BETWEEN ? AND ?
            ),
            pitching_data AS (
                SELECT
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    ip,
                    war as pitching_war,
                    pwpa as pitching_wpa,
                    pwpa_li as pitching_wpa_li,
                    prea as pitching_rea,
                    clutch as pitching_clutch
                FROM pitching
                WHERE division = ? AND year BETWEEN ? AND ?
            ),
            combined AS (
                SELECT 
                    COALESCE(b.player_id, p.player_id) as player_id,
                    COALESCE(b.player_name, p.player_name) as player_name,
                    COALESCE(b.team_name, p.team_name) as team_name,
                    COALESCE(b.conference, p.conference) as conference,
                    COALESCE(b.division, p.division) as division,
                    COALESCE(b.year, p.year) as year,
                    COALESCE(b.pa, 0) as pa,
                    COALESCE(p.ip, 0) as ip,
                    COALESCE(b.batting_war, 0) as batting_war,
                    COALESCE(p.pitching_war, 0) as pitching_war,
                    COALESCE(b.batting_wpa, 0) as batting_wpa,
                    COALESCE(p.pitching_wpa, 0) as pitching_wpa,
                    COALESCE(b.batting_wpa_li, 0) as batting_wpa_li,
                    COALESCE(p.pitching_wpa_li, 0) as pitching_wpa_li,
                    COALESCE(b.batting_rea, 0) as batting_rea,
                    COALESCE(p.pitching_rea, 0) as pitching_rea,
                    COALESCE(b.batting_clutch, 0) as batting_clutch,
                    COALESCE(p.pitching_clutch, 0) as pitching_clutch
                FROM batting_data b
                FULL OUTER JOIN pitching_data p 
                    ON b.player_id = p.player_id 
                    AND b.year = p.year
            )
            SELECT 
                player_id,
                player_name,
                team_name,
                conference,
                division,
                year,
                pa,
                ip,
                batting_war,
                pitching_war,
                ROUND(batting_war + pitching_war, 1) as total_war,
                batting_wpa,
                pitching_wpa,
                ROUND(batting_wpa + pitching_wpa, 1) as total_wpa,
                batting_wpa_li,
                pitching_wpa_li,
                ROUND(batting_wpa_li + pitching_wpa_li, 1) as total_wpa_li,
                batting_rea,
                pitching_rea,
                ROUND(batting_rea + pitching_rea, 1) as total_rea,
                batting_clutch,
                pitching_clutch,
                ROUND(batting_clutch + pitching_clutch, 1) as total_clutch,
                PERCENT_RANK() OVER (PARTITION BY year ORDER BY batting_war) * 100 as batting_war_percentile,
                PERCENT_RANK() OVER (PARTITION BY year ORDER BY pitching_war) * 100 as pitching_war_percentile,
                PERCENT_RANK() OVER (PARTITION BY year ORDER BY ROUND(batting_war + pitching_war, 1)) * 100 as total_war_percentile
            FROM combined
            ORDER BY total_war DESC
        """, (division, start_year, end_year, division, start_year, end_year))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except sqlite3.Error as e:
        logging.error(f"Database error in get_value_leaderboard: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/baserunning')
@bp.get('/baserunning/<string:player_id>')
def get_player_baserunning(player_id=None):
    start_year = request.args.get('start_year', 'MIN_YEAR')
    end_year = request.args.get('end_year', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < MIN_YEAR or end_year > MAX_YEAR or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if player_id:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    baserunning,
                    wsb,
                    wgdp,
                    wteb,
                    picked,
                    sb,
                    cs,
                    sb_pct,
                    opportunities,
                    outs_ob,
                    ebt,
                    CASE 
                        WHEN opportunities > 0 THEN ROUND((ebt * 100.0 / opportunities), 1)
                        ELSE 0
                    END AS xbt_pct
                FROM baserunning
                WHERE division = ? 
                    AND year BETWEEN ? AND ?
                    AND player_id = ?
                ORDER BY year DESC, baserunning DESC
            """, (division, start_year, end_year, player_id))
        else:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    baserunning,
                    wsb,
                    wgdp,
                    wteb,
                    picked,
                    sb,
                    cs,
                    sb_pct,
                    opportunities,
                    outs_ob,
                    ebt,
                    CASE 
                        WHEN opportunities > 0 THEN ROUND((ebt * 100.0 / opportunities), 1)
                        ELSE 0
                    END AS xbt_pct
                FROM baserunning
                WHERE division = ? 
                    AND year BETWEEN ? AND ?
                ORDER BY year DESC, baserunning DESC
            """, (division, start_year, end_year))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except sqlite3.Error as e:
        logging.error(f"Database error in get_player_baserunning: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/rolling')
def get_rolling_leaderboard():
    division = request.args.get('division', type=int, default=3)
    window = request.args.get('window', type=int, default=25)
    sort_order = request.args.get('sort_order', default='desc')
    player_type = request.args.get('player_type', default='batter')

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400
    if window not in [25, 50, 100]:
        return jsonify({"error": "Invalid window value. Must be 25, 50, or 100."}), 400
    if sort_order.lower() not in ['asc', 'desc']:
        return jsonify({"error": "Invalid sort_order. Must be 'asc' or 'desc'."}), 400
    if player_type.lower() not in ['batter', 'pitcher']:
        return jsonify({"error": "Invalid player_type. Must be 'batter' or 'pitcher'."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if player_type.lower() == 'batter':
            cursor.execute(f"""
                WITH latest_batting AS (
                    SELECT b.*
                    FROM batting b
                    JOIN (
                        SELECT player_id, MAX(year) AS max_year
                        FROM batting
                        WHERE division = ?
                        GROUP BY player_id
                    ) m ON m.player_id = b.player_id AND m.max_year = b.year
                    WHERE b.division = ?
                ),
                team_org AS (
                    SELECT team_name, year, division, MAX(org_id) AS org_id
                    FROM rosters
                    GROUP BY team_name, year, division
                )
                SELECT 
                    r.player_id,
                    b.player_name,
                    b.team_name,
                    b.conference,
                    COALESCE(t.org_id, NULL) AS team_org_id,
                    ROUND(r."{window}_now", 3) as woba_now,
                    ROUND(r."{window}_then", 3) as woba_then,
                    ROUND(r."{window}_delta", 3) as woba_change
                FROM rolling_batting r
                JOIN latest_batting b ON r.player_id = b.player_id
                LEFT JOIN team_org t 
                    ON t.team_name = b.team_name 
                    AND t.year = b.year 
                    AND t.division = b.division
                WHERE r.player_id IS NOT NULL
                    AND r."{window}_now" IS NOT NULL 
                    AND r."{window}_then" IS NOT NULL
                ORDER BY r."{window}_delta" {'DESC' if sort_order.lower() == 'desc' else 'ASC'}
            """, (division, division))
        else:
            cursor.execute(f"""
                WITH latest_pitching AS (
                    SELECT p.*
                    FROM pitching p
                    JOIN (
                        SELECT player_id, MAX(year) AS max_year
                        FROM pitching
                        WHERE division = ?
                        GROUP BY player_id
                    ) m ON m.player_id = p.player_id AND m.max_year = p.year
                    WHERE p.division = ?
                ),
                team_org AS (
                    SELECT team_name, year, division, MAX(org_id) AS org_id
                    FROM rosters
                    GROUP BY team_name, year, division
                )
                SELECT 
                    r.player_id,
                    p.player_name,
                    p.team_name,
                    p.conference,
                    COALESCE(t.org_id, NULL) AS team_org_id,
                    ROUND(r."{window}_now", 3) as woba_now,
                    ROUND(r."{window}_then", 3) as woba_then,
                    ROUND(r."{window}_delta", 3) as woba_change
                FROM rolling_pitching r
                JOIN latest_pitching p ON r.player_id = p.player_id
                LEFT JOIN team_org t 
                    ON t.team_name = p.team_name 
                    AND t.year = p.year 
                    AND t.division = p.division
                WHERE r.player_id IS NOT NULL
                    AND r."{window}_now" IS NOT NULL 
                    AND r."{window}_then" IS NOT NULL
                ORDER BY r."{window}_delta" {'DESC' if sort_order.lower() == 'desc' else 'ASC'}
            """, (division, division))

        results = []
        for row in cursor.fetchall():
            results.append({
                'player_id': row[0],
                'player_name': row[1],
                'team_name': row[2],
                'conference': row[3],
                'team_org_id': row[4],
                'woba_now': row[5],
                'woba_then': row[6],
                'woba_change': row[7]
            })

        return jsonify({
            "items": results,
            "window": window,
            "player_type": player_type
        })

    except Exception as e:
        logging.error(f"Error in get_rolling_leaderboard: {e}")
        return jsonify({"error": f"Error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/situational')
@bp.get('/situational/<string:player_id>')
def get_player_situational(player_id=None):
    start_year = request.args.get('start_year', 'MIN_YEAR')
    end_year = request.args.get('end_year', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)
    min_pa = request.args.get('min_pa', type=int, default=50)
    count_alias = request.args.get('count', type=int)
    if isinstance(count_alias, int):
        min_pa = count_alias

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < MIN_YEAR or end_year > MAX_YEAR or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if player_id:
            cursor.execute("""
                SELECT 
                    sb.player_id,
                    sb.player_name,
                    sb.team_name,
                    sb.conference,
                    sb.division,
                    sb.year,
                    sb.woba_overall,
                    sb.woba_risp,
                    sb.woba_high_leverage,
                    sb.woba_low_leverage,
                    sb.pa_overall,
                    sb.pa_risp,
                    sb.pa_high_leverage,
                    sb.pa_low_leverage,
                    sb.ba_overall,
                    sb.ba_high_leverage,
                    sb.ba_low_leverage,
                    sb.ba_risp,
                    sb.re24_overall,
                    sb.re24_high_leverage,
                    sb.re24_low_leverage,
                    sb.re24_risp,
                    sb.clutch,
                    b.wpa,
                    b.wpa_li,
                    b.rea,
                    b.war as batting_war,
                    COALESCE(p.war, 0) as pitching_war,
                    COALESCE(p.pwpa, 0) as pitching_wpa,
                    COALESCE(p.pwpa_li, 0) as pitching_wpa_li,
                    COALESCE(p.prea, 0) as pitching_rea,
                    COALESCE(p.clutch, 0) as pitching_clutch,
                    ROUND(b.war + COALESCE(p.war, 0), 1) as total_war,
                    ROUND(b.wpa + COALESCE(p.pwpa, 0), 1) as total_wpa,
                    ROUND(b.wpa_li + COALESCE(p.pwpa_li, 0), 1) as total_wpa_li,
                    ROUND(b.rea + COALESCE(p.prea, 0), 1) as total_rea,
                    ROUND(sb.clutch + COALESCE(p.clutch, 0), 1) as total_clutch
                FROM situational_batting sb
                LEFT JOIN batting b ON sb.player_id = b.player_id AND sb.year = b.year AND sb.division = b.division
                LEFT JOIN pitching p ON sb.player_id = p.player_id AND sb.year = p.year AND sb.division = p.division
                WHERE sb.division = ?
                    AND sb.year BETWEEN ? AND ?
                    AND sb.pa_overall >= ?
                    AND sb.player_id = ?
                ORDER BY sb.year DESC, sb.woba_overall DESC
            """, (division, start_year, end_year, min_pa, player_id))
        else:
            cursor.execute("""
                SELECT 
                    sb.player_id,
                    sb.player_name,
                    sb.team_name,
                    sb.conference,
                    sb.division,
                    sb.year,
                    sb.woba_overall,
                    sb.woba_risp,
                    sb.woba_high_leverage,
                    sb.woba_low_leverage,
                    sb.pa_overall,
                    sb.pa_risp,
                    sb.pa_high_leverage,
                    sb.pa_low_leverage,
                    sb.ba_overall,
                    sb.ba_high_leverage,
                    sb.ba_low_leverage,
                    sb.ba_risp,
                    sb.re24_overall,
                    sb.re24_high_leverage,
                    sb.re24_low_leverage,
                    sb.re24_risp,
                    sb.clutch,
                    b.wpa,
                    b.wpa_li,
                    b.rea,
                    b.war as batting_war,
                    COALESCE(p.war, 0) as pitching_war,
                    COALESCE(p.pwpa, 0) as pitching_wpa,
                    COALESCE(p.pwpa_li, 0) as pitching_wpa_li,
                    COALESCE(p.prea, 0) as pitching_rea,
                    COALESCE(p.clutch, 0) as pitching_clutch,
                    ROUND(b.war + COALESCE(p.war, 0), 1) as total_war,
                    ROUND(b.wpa + COALESCE(p.pwpa, 0), 1) as total_wpa,
                    ROUND(b.wpa_li + COALESCE(p.pwpa_li, 0), 1) as total_wpa_li,
                    ROUND(b.rea + COALESCE(p.prea, 0), 1) as total_rea,
                    ROUND(sb.clutch + COALESCE(p.clutch, 0), 1) as total_clutch
                FROM situational_batting sb
                LEFT JOIN batting b ON sb.player_id = b.player_id AND sb.year = b.year AND sb.division = b.division
                LEFT JOIN pitching p ON sb.player_id = p.player_id AND sb.year = p.year AND sb.division = p.division
                WHERE sb.division = ?
                    AND sb.year BETWEEN ? AND ?
                    AND sb.pa_overall >= ?
                ORDER BY sb.year DESC, sb.woba_overall DESC
            """, (division, start_year, end_year, min_pa))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except sqlite3.Error as e:
        logging.error(f"Database error in get_player_situational: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/situational_pitcher')
@bp.get('/situational_pitcher/<string:player_id>')
def get_player_situational_pitcher(player_id=None):
    start_year = request.args.get('start_year', 'MIN_YEAR')
    end_year = request.args.get('end_year', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)
    min_bf = request.args.get('min_bf', type=int, default=100)
    count_alias = request.args.get('count', type=int)
    if isinstance(count_alias, int):
        min_bf = count_alias

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < MIN_YEAR or end_year > MAX_YEAR or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if player_id:
            cursor.execute("""
                SELECT 
                    sp.player_id,
                    sp.player_name,
                    sp.team_name,
                    sp.conference,
                    sp.division,
                    sp.year,
                    sp.woba_overall,
                    sp.woba_risp,
                    sp.woba_high_leverage,
                    sp.woba_low_leverage,
                    sp.pa_overall,
                    sp.pa_risp,
                    sp.pa_high_leverage,
                    sp.pa_low_leverage,
                    sp.ba_overall,
                    sp.ba_high_leverage,
                    sp.ba_low_leverage,
                    sp.ba_risp,
                    sp.re24_overall,
                    sp.re24_high_leverage,
                    sp.re24_low_leverage,
                    sp.re24_risp,
                    sp.clutch,
                    p.pwpa,
                    p.pwpa_li,
                    p.prea,
                    p.war as pitching_war,
                    COALESCE(b.war, 0) as batting_war,
                    COALESCE(b.wpa, 0) as batting_wpa,
                    COALESCE(b.wpa_li, 0) as batting_wpa_li,
                    COALESCE(b.rea, 0) as batting_rea,
                    COALESCE(b.clutch, 0) as batting_clutch,
                    ROUND(p.war + COALESCE(b.war, 0), 1) as total_war,
                    ROUND(p.pwpa + COALESCE(b.wpa, 0), 1) as total_wpa,
                    ROUND(p.pwpa_li + COALESCE(b.wpa_li, 0), 1) as total_wpa_li,
                    ROUND(p.prea + COALESCE(b.rea, 0), 1) as total_rea,
                    ROUND(sp.clutch + COALESCE(b.clutch, 0), 1) as total_clutch
                FROM situational_pitching sp
                LEFT JOIN pitching p ON sp.player_id = p.player_id AND sp.year = p.year AND sp.division = p.division
                LEFT JOIN batting b ON sp.player_id = b.player_id AND sp.year = b.year AND sp.division = b.division
                WHERE sp.division = ?
                    AND sp.year BETWEEN ? AND ?
                    AND sp.pa_overall >= ?
                    AND sp.player_id = ?
                ORDER BY sp.year DESC, sp.woba_overall ASC
            """, (division, start_year, end_year, min_bf, player_id))
        else:
            cursor.execute("""
                SELECT 
                    sp.player_id,
                    sp.player_name,
                    sp.team_name,
                    sp.conference,
                    sp.division,
                    sp.year,
                    sp.woba_overall,
                    sp.woba_risp,
                    sp.woba_high_leverage,
                    sp.woba_low_leverage,
                    sp.pa_overall,
                    sp.pa_risp,
                    sp.pa_high_leverage,
                    sp.pa_low_leverage,
                    sp.ba_overall,
                    sp.ba_high_leverage,
                    sp.ba_low_leverage,
                    sp.ba_risp,
                    sp.re24_overall,
                    sp.re24_high_leverage,
                    sp.re24_low_leverage,
                    sp.re24_risp,
                    sp.clutch,
                    p.pwpa,
                    p.pwpa_li,
                    p.prea,
                    p.war as pitching_war,
                    COALESCE(b.war, 0) as batting_war,
                    COALESCE(b.wpa, 0) as batting_wpa,
                    COALESCE(b.wpa_li, 0) as batting_wpa_li,
                    COALESCE(b.rea, 0) as batting_rea,
                    COALESCE(b.clutch, 0) as batting_clutch,
                    ROUND(p.war + COALESCE(b.war, 0), 1) as total_war,
                    ROUND(p.pwpa + COALESCE(b.wpa, 0), 1) as total_wpa,
                    ROUND(p.pwpa_li + COALESCE(b.wpa_li, 0), 1) as total_wpa_li,
                    ROUND(p.prea + COALESCE(b.rea, 0), 1) as total_rea,
                    ROUND(sp.clutch + COALESCE(b.clutch, 0), 1) as total_clutch
                FROM situational_pitching sp
                LEFT JOIN pitching p ON sp.player_id = p.player_id AND sp.year = p.year AND sp.division = p.division
                LEFT JOIN batting b ON sp.player_id = b.player_id AND sp.year = b.year AND sp.division = b.division
                WHERE sp.division = ?
                    AND sp.year BETWEEN ? AND ?
                    AND sp.pa_overall >= ?
                ORDER BY sp.year DESC, sp.woba_overall ASC
            """, (division, start_year, end_year, min_bf))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except sqlite3.Error as e:
        logging.error(f"Database error in get_player_situational_pitcher: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/splits')
@bp.get('/splits/<string:player_id>')
def get_player_splits(player_id=None):
    start_year = request.args.get('start_year', 'MIN_YEAR')
    end_year = request.args.get('end_year', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)
    min_pa = request.args.get('min_pa', type=int, default=50)
    count_alias = request.args.get('count', type=int)
    if isinstance(count_alias, int):
        min_pa = count_alias

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < MIN_YEAR or end_year > MAX_YEAR or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if player_id:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    pa_overall,
                    ba_overall,
                    ob_pct_overall,
                    slg_pct_overall,
                    woba_overall,
                    pa_vs_rhp,
                    ba_vs_rhp,
                    ob_pct_vs_rhp,
                    slg_pct_vs_rhp,
                    woba_vs_rhp,
                    pa_vs_lhp,
                    ba_vs_lhp,
                    ob_pct_vs_lhp,
                    slg_pct_vs_lhp,
                    woba_vs_lhp
                FROM splits_batting
                WHERE division = ?
                    AND year BETWEEN ? AND ?
                    AND pa_overall >= ?
                    AND player_id = ?
                ORDER BY year DESC, woba_overall DESC
            """, (division, start_year, end_year, min_pa, player_id))
        else:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    pa_overall,
                    ba_overall,
                    ob_pct_overall,
                    slg_pct_overall,
                    woba_overall,
                    pa_vs_rhp,
                    ba_vs_rhp,
                    ob_pct_vs_rhp,
                    slg_pct_vs_rhp,
                    woba_vs_rhp,
                    pa_vs_lhp,
                    ba_vs_lhp,
                    ob_pct_vs_lhp,
                    slg_pct_vs_lhp,
                    woba_vs_lhp
                FROM splits_batting
                WHERE division = ?
                    AND year BETWEEN ? AND ?
                    AND pa_overall >= ?
                ORDER BY year DESC, woba_overall DESC
            """, (division, start_year, end_year, min_pa))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except sqlite3.Error as e:
        logging.error(f"Database error in get_player_splits: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/splits_pitcher')
@bp.get('/splits_pitcher/<string:player_id>')
def get_player_splits_pitcher(player_id=None):
    start_year = request.args.get('start_year', 'MIN_YEAR')
    end_year = request.args.get('end_year', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)
    min_bf = request.args.get('min_bf', type=int, default=100)
    count_alias = request.args.get('count', type=int)
    if isinstance(count_alias, int):
        min_bf = count_alias

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < MIN_YEAR or end_year > MAX_YEAR or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if player_id:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    pa_overall,
                    ba_overall,
                    ob_pct_overall,
                    slg_pct_overall,
                    woba_overall,
                    pa_vs_rhh,
                    ba_vs_rhh,
                    ob_pct_vs_rhh,
                    slg_pct_vs_rhh,
                    woba_vs_rhh,
                    pa_vs_lhh,
                    ba_vs_lhh,
                    ob_pct_vs_lhh,
                    slg_pct_vs_lhh,
                    woba_vs_lhh
                FROM splits_pitching
                WHERE division = ?
                    AND year BETWEEN ? AND ?
                    AND pa_overall >= ?
                    AND player_id = ?
                ORDER BY year DESC, woba_overall ASC
            """, (division, start_year, end_year, min_bf, player_id))
        else:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    pa_overall,
                    ba_overall,
                    ob_pct_overall,
                    slg_pct_overall,
                    woba_overall,
                    pa_vs_rhh,
                    ba_vs_rhh,
                    ob_pct_vs_rhh,
                    slg_pct_vs_rhh,
                    woba_vs_rhh,
                    pa_vs_lhh,
                    ba_vs_lhh,
                    ob_pct_vs_lhh,
                    slg_pct_vs_lhh,
                    woba_vs_lhh
                FROM splits_pitching
                WHERE division = ?
                    AND year BETWEEN ? AND ?
                    AND pa_overall >= ?
                ORDER BY year DESC, woba_overall ASC
            """, (division, start_year, end_year, min_bf))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except sqlite3.Error as e:
        logging.error(f"Database error in get_player_splits_pitcher: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


@bp.get('/batted_ball')
@bp.get('/batted_ball/<string:player_id>')
def get_player_batted_ball(player_id=None):
    start_year = request.args.get('start_year', 'MIN_YEAR')
    end_year = request.args.get('end_year', 'MAX_YEAR')
    division = request.args.get('division', type=int, default=3)
    min_bb = request.args.get('min_bb', type=int, default=100)

    if division not in [1, 2, 3]:
        return jsonify({"error": "Invalid division. Must be 1, 2, or 3."}), 400

    try:
        start_year = int(start_year)
        end_year = int(end_year)
    except ValueError:
        return jsonify({"error": "Invalid parameters"}), 400

    if start_year < MIN_YEAR or end_year > MAX_YEAR or start_year > end_year:
        return jsonify({"error": "Invalid year range"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if player_id:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    count,
                    batter_hand,
                    pull_pct,
                    oppo_pct,
                    middle_pct,
                    gb_pct,
                    fb_pct,
                    ld_pct,
                    pop_pct,
                    pull_air_pct,
                    oppo_gb_pct
                FROM batted_ball
                WHERE division = ?
                    AND year BETWEEN ? AND ?
                    AND count >= ?
                    AND player_id = ?
                ORDER BY year DESC, count DESC
            """, (division, start_year, end_year, min_bb, player_id))
        else:
            cursor.execute("""
                SELECT 
                    player_id,
                    player_name,
                    team_name,
                    conference,
                    division,
                    year,
                    count,
                    batter_hand,
                    pull_pct,
                    oppo_pct,
                    middle_pct,
                    gb_pct,
                    fb_pct,
                    ld_pct,
                    pop_pct,
                    pull_air_pct,
                    oppo_gb_pct
                FROM batted_ball
                WHERE division = ?
                    AND year BETWEEN ? AND ?
                    AND count >= ?
                ORDER BY year DESC, count DESC
            """, (division, start_year, end_year, min_bb))

        results = [dict(row) for row in cursor.fetchall()]
        return jsonify(results)

    except sqlite3.Error as e:
        logging.error(f"Database error in get_player_batted_ball: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()