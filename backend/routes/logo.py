from flask import Blueprint, Response, request
import requests


bp = Blueprint('logo', __name__, url_prefix='/api')


@bp.get('/logo')
def logo_proxy():
    url = request.args.get("url")
    r = requests.get(url, stream=True)

    resp = Response(r.content, content_type=r.headers.get("Content-Type", "image/png"))
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    resp.headers["Cache-Control"] = "public, max-age=86400"
    resp.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    resp.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return resp


