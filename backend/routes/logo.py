from flask import Blueprint, Response, request, jsonify
from urllib.parse import urlparse
import ipaddress
import socket
import requests

bp = Blueprint('logo', __name__, url_prefix='/api')

MAX_LOGO_BYTES = 1_000_000

@bp.get('/logo')
def logo_proxy():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "Missing url parameter"}), 400

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return jsonify({"error": "Invalid URL scheme"}), 400
    if not parsed.hostname:
        return jsonify({"error": "Invalid URL"}), 400
    if parsed.username or parsed.password:
        return jsonify({"error": "Credentials in URL are not allowed"}), 400

    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM)
        ips = {info[4][0] for info in infos}
        for ip_str in ips:
            ip = ipaddress.ip_address(ip_str)
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_unspecified
                or ip.is_reserved
            ):
                return jsonify({"error": "Blocked host"}), 400
    except Exception:
        return jsonify({"error": "Unable to resolve host"}), 400

    try:
        r = requests.get(
            url,
            stream=True,
            timeout=5,
            allow_redirects=False,
            headers={"User-Agent": "d3-dashboard-logo-proxy"},
        )
    except requests.RequestException:
        return jsonify({"error": "Failed to fetch image"}), 502

    if r.status_code < 200 or r.status_code >= 300:
        return jsonify({"error": "Failed to fetch image"}), 502

    content_type = r.headers.get("Content-Type", "")
    if not content_type.startswith("image/"):
        return jsonify({"error": "URL did not return an image"}), 400

    size = 0
    chunks = []
    for chunk in r.iter_content(chunk_size=64 * 1024):
        if not chunk:
            continue
        size += len(chunk)
        if size > MAX_LOGO_BYTES:
            return jsonify({"error": "Image too large"}), 413
        chunks.append(chunk)

    resp = Response(b"".join(chunks), content_type=content_type)
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


