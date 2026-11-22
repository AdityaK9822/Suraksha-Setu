#!/usr/bin/env python3
"""Fake verify backend for debugging the kiosk firmware.

Logs the raw request line (so header injection / traversal is visible) and
returns the plain-text statuses backend.rs parses.

    python3 scripts/fake_backend.py --port 4001

Serial prefix selects the canned status:
    verified...   -> VERIFIED SS-000123
    registered... -> REGISTERED SS-000123
    notfound...   -> NOTFOUND
    duplicate...  -> DUPLICATE -> SS-000123
    error...      -> ERROR
    anything else -> VERIFIED <serial>
Hash lookups always return VERIFIED <first 8 hex chars>.
"""

import argparse
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_LOG_BODY = 64


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _log_request(self):
        length = self.headers.get("Content-Length")
        print(
            f"REQ {self.command} {self.requestline!r} "
            f"content-length={length!r} transfer-encoding="
            f"{self.headers.get('Transfer-Encoding')!r}",
            flush=True,
        )
        for name, value in self.headers.items():
            print(f"  {name}: {value}", flush=True)

    def _read_body(self):
        if (self.headers.get("Transfer-Encoding") or "").lower() == "chunked":
            total = 0
            while True:
                line = self.rfile.readline().strip()
                size = int(line.split(b";")[0] or b"0", 16)
                if size == 0:
                    self.rfile.readline()
                    break
                total += size
                self.rfile.read(size)
                self.rfile.read(2)
            print(f"  chunked body: {total} bytes", flush=True)
            return
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else b""
        print(
            f"  body: {len(body)} bytes, first {MAX_LOG_BODY}: "
            f"{body[:MAX_LOG_BODY]!r}",
            flush=True,
        )

    def _status_for(self, path):
        if path.startswith("/verify/serial/"):
            serial = path[len("/verify/serial/"):]
            low = serial.lower()
            if low.startswith("notfound"):
                return "NOTFOUND"
            if low.startswith("registered"):
                return "REGISTERED SS-000123"
            if low.startswith("duplicate"):
                return "DUPLICATE -> SS-000123"
            if low.startswith("error"):
                return "ERROR"
            return f"VERIFIED {serial}"
        if path.startswith("/verify/hash/0x"):
            digest = path[len("/verify/hash/0x"):]
            return f"VERIFIED {digest[:8]}"
        if path == "/health":
            return "OK"
        return "NOTFOUND"

    def _respond(self, body):
        data = body.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        self._log_request()
        self._respond(self._status_for(self.path))

    def do_POST(self):
        self._log_request()
        self._read_body()
        self._respond(self._status_for(self.path))

    def log_message(self, fmt, *args):
        print(f"SERVER {fmt % args}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4001)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("0.0.0.0", args.port), Handler)
    print(f"fake backend on 0.0.0.0:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()
