"""Tiny static dev server with caching disabled (used by .claude/launch.json)."""
import http.server
import sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        # Serve the custom 404 page like most static hosts do.
        if code == 404:
            try:
                with open("404.html", "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            except OSError:
                pass
        super().send_error(code, message, explain)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4321
http.server.ThreadingHTTPServer(("127.0.0.1", port), NoCache).serve_forever()
