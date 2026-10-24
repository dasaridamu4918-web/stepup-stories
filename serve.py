import http.server
import socketserver
import os

PORT = 4173
ROOT = r"C:\Users\91965\.gemini\antigravity\scratch\stepup-stories"

class WatchSiteHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        rel = path.split("?", 1)[0].split("#", 1)[0].lstrip("/")
        primary = os.path.join(ROOT, rel)
        if os.path.exists(primary):
            return primary
        fallback_public = os.path.join(ROOT, "public", rel)
        if os.path.exists(fallback_public):
            return fallback_public
        return primary

class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

os.chdir(ROOT)
with ThreadingHTTPServer(("127.0.0.1", PORT), WatchSiteHandler) as httpd:
    print(f"Serving STEPUP STORIES at http://127.0.0.1:{PORT}")
    httpd.serve_forever()
