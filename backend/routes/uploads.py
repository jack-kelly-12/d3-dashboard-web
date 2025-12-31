from flask import Blueprint, jsonify, request, current_app
from flask_cors import cross_origin
import pandas as pd
from io import StringIO
import traceback

from middleware import require_api_auth_write

bp = Blueprint('uploads', __name__, url_prefix='/api/upload')

@bp.route('/rapsodo', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
@require_api_auth_write
def upload_rapsodo():
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    if 'file' not in request.files:
        response = jsonify({"error": "No file provided"})
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    try:
        content = file.read().decode('utf-8')

        player_name_index = content.find('Player Name:')
        if player_name_index != -1:
            player_name = content[player_name_index +
                                  len('Player Name:'):].split('\n')[0].strip()
        else:
            player_name = "Unknown Player"

        lines = content.split('\n')[4:]
        modified_content = '\n'.join(lines)
        csv_file = StringIO(modified_content)

        df = pd.read_csv(
            csv_file,
            delimiter=',',
            encoding='utf-8',
            on_bad_lines='skip'
        )

        processed_pitches = []
        for idx, row in df.iterrows():
            try:
                pitch_type = row.get('Pitch Type', '')
                if pd.isna(pitch_type) or str(pitch_type).strip() == '-':
                    continue
                df.loc[idx] = row.replace('-', pd.NA)

                pitch = {
                    'player': player_name,
                    'timestamp': pd.to_datetime(row['Date']).isoformat() if pd.notna(row.get('Date')) else None,
                    'type': str(pitch_type).lower(),
                    'velocity': float(row['Velocity']) if pd.notna(row.get('Velocity')) else None,
                    'spin_rate': float(row['Total Spin']) if pd.notna(row.get('Total Spin')) else None,
                    'spin_eff': float(row['Spin Efficiency (release)']) if pd.notna(row.get('Spin Efficiency (release)')) else None,
                    'horz_break': float(row['HB (trajectory)']) if pd.notna(row.get('HB (trajectory)')) else None,
                    'vert_break': float(row['VB (trajectory)']) if pd.notna(row.get('VB (trajectory)')) else None,
                    'strike_zone_x': float(row['Strike Zone Side']) if pd.notna(row.get('Strike Zone Side')) else None,
                    'strike_zone_z': float(row['Strike Zone Height']) if pd.notna(row.get('Strike Zone Height')) else None,
                    'rel_side': float(row['Release Side']) if pd.notna(row.get('Release Side')) else None,
                    'rel_height': float(row['Release Height']) if pd.notna(row.get('Release Height')) else None,
                    'zone_type': 'standard'
                }
                processed_pitches.append(pitch)

            except Exception:
                continue

        if not processed_pitches:
            return jsonify({"error": "No valid pitches found in file"}), 400

        return jsonify({
            'pitches': processed_pitches,
            'zone_type': 'standard'
        })

    except Exception as e:
        print(f"Major error processing file: {str(e)}")
        print(f"Error type: {type(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@bp.route('/trackman', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
@require_api_auth_write
def upload_trackman():
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    if 'file' not in request.files:
        response = jsonify({"error": "No file provided"})
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 400
    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format"}), 400

        processed_pitches = []
        for _, row in df.iterrows():
            pitch = {
                'timestamp': pd.Timestamp.now().isoformat(),
                'type': str(row.get('TaggedPitchType', '')).lower(),
                'velocity': float(row.get('RelSpeed')) if pd.notna(row.get('RelSpeed')) else None,
                'spinRate': float(row.get('SpinRate')) if pd.notna(row.get('SpinRate')) else None,
                'spinAxis': float(row.get('SpinAxis')) if pd.notna(row.get('SpinAxis')) else None,
                'horizontalBreak': float(row.get('HorzBreak')) if pd.notna(row.get('HorzBreak')) else None,
                'verticalBreak': float(row.get('InducedVertBreak')) if pd.notna(row.get('InducedVertBreak')) else None,
                'plateLocHeight': float(row.get('PlateLocHeight')) if pd.notna(row.get('PlateLocHeight')) else None,
                'plateLocSide': float(row.get('PlateLocSide')) if pd.notna(row.get('PlateLocSide')) else None,
                'extension': float(row.get('Extension')) if pd.notna(row.get('Extension')) else None,
                'source': 'trackman',
                'zoneType': 'standard'
            }
            processed_pitches.append(pitch)

        return jsonify({
            'pitches': processed_pitches,
            'playerInfo': {
                'pitcher': df['Pitcher'].iloc[0] if 'Pitcher' in df.columns else None,
                'team': df['PitcherTeam'].iloc[0] if 'PitcherTeam' in df.columns else None
            },
            'zoneType': 'standard'
        })

    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500


@bp.route('/d3', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
@require_api_auth_write
def upload_d3():
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    if 'file' not in request.files:
        response = jsonify({"error": "No file provided"})
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    chart_type = request.args.get('chartType', 'game')
    zone_type = request.args.get('zoneType', 'standard')

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format"}), 400

        processed_pitches = []

        if chart_type == 'bullpen':
            for _, row in df.iterrows():
                pitcher_info = {
                    'name': row.get('pitcher', ''),
                    'pitchHand': row.get('pitcherHand', '')
                }

                pitch = {
                    'timestamp': row.get('time', pd.Timestamp.now().isoformat()),
                    'pitcher': pitcher_info,
                    'type': str(row.get('pitchType', '')).lower(),
                    'velocity': float(row['velocity']) if pd.notna(row.get('velocity')) else None,
                    'intendedZone': str(row.get('intendedZone', '')),
                    'x': float(row['pitchX']) if pd.notna(row.get('pitchX')) else None,
                    'y': float(row['pitchY']) if pd.notna(row.get('pitchY')) else None,
                    'note': str(row.get('notes', '-')),
                    'zoneType': zone_type
                }
                processed_pitches.append(pitch)

        else:
            for _, row in df.iterrows():
                pitcher_info = {
                    'name': row.get('pitcher', ''),
                    'pitchHand': row.get('pitcherHand', '')
                }

                batter_info = {
                    'name': row.get('batter', ''),
                    'batHand': row.get('batterHand', '')
                }

                hit_details = None
                if pd.notna(row.get('hitX')) and pd.notna(row.get('hitY')):
                    hit_details = {
                        'x': float(row['hitX']),
                        'y': float(row['hitY'])
                    }

                pitch = {
                    'timestamp': row.get('time', pd.Timestamp.now().isoformat()),
                    'pitcher': pitcher_info,
                    'batter': batter_info,
                    'type': str(row.get('pitchType', '')).lower(),
                    'velocity': float(row['velocity']) if pd.notna(row.get('velocity')) else None,
                    'result': str(row.get('result', '')).replace(' ', '_'),
                    'hitResult': str(row.get('hitResult', '')).replace(' ', '_'),
                    'x': float(row['pitchX']) if pd.notna(row.get('pitchX')) else None,
                    'y': float(row['pitchY']) if pd.notna(row.get('pitchY')) else None,
                    'hitDetails': hit_details,
                    'note': str(row.get('notes', '-')),
                    'zoneType': zone_type
                }
                processed_pitches.append(pitch)

        if not processed_pitches:
            return jsonify({"error": "No valid pitches found in file"}), 400

        first_pitch = processed_pitches[0]
        player_info = {
            'pitcher': first_pitch.get('pitcher', {}).get('name'),
            'pitcherHand': first_pitch.get('pitcher', {}).get('pitchHand')
        }

        return jsonify({
            'pitches': processed_pitches,
            'playerInfo': player_info,
            'zoneType': zone_type
        })

    except Exception as e:
        print(f"Error processing D3 file: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500

