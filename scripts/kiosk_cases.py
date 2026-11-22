#!/usr/bin/env python3
"""Send the debug cases from the plan to a running kiosk.

Usage:
    python3 scripts/kiosk_cases.py                 # default 192.168.2.1:80
    python3 scripts/kiosk_cases.py --host 192.168.2.1

Serial cases expose injection/traversal/trailing-space handling.
Body cases expose Content-Length parsing and partial-upload handling.
Run the fake backend first and watch its log for what actually reaches it.
"""

import argparse
import socket

SERIAL = "/verify/serial/SS-000123"
PDF = b"%PDF-1.4\n% debug vector\n%%EOF\n"


def request(path, method="GET", body=b"", headers=None):
    lines = [f"{method} {path} HTTP/1.1", "Host: k", "Connection: close"]
    for name, value in (headers or {}).items():
        lines.append(f"{name}: {value}")
    raw = "\r\n".join(lines).encode() + b"\r\n\r\n" + body
    return raw


SERIAL_CASES = [
    ("normal", request(SERIAL)),
    ("trailing space", request(SERIAL + "%20")),
    ("CRLF injection", request(SERIAL + "%0d%0aX-Injected:%20yes")),
    ("traversal", request("/verify/serial/..%2f..%2fhealth")),
    ("query injection", request("/verify/serial/SS%3fdebug=1")),
    ("long serial", request("/verify/serial/" + "A" * 40)),
    ("empty serial", request("/verify/serial/")),
]

BODY_CASES = [
    (
        "normal PDF",
        request(
            "/verify-file",
            "POST",
            PDF,
            {"Content-Type": "application/octet-stream", "Content-Length": str(len(PDF))},
        ),
    ),
    (
        "lowercase content-length",
        request(
            "/verify-file",
            "POST",
            PDF,
            {"Content-Type": "application/octet-stream", "Content-length": str(len(PDF))},
        ),
    ),
    (
        "missing content-length",
        request("/verify-file", "POST", PDF, {"Content-Type": "application/octet-stream"}),
    ),
    (
        "chunked",
        request(
            "/verify-file",
            "POST",
            b"%x\r\n" % len(PDF) + PDF + b"\r\n0\r\n\r\n",
            {"Content-Type": "application/octet-stream", "Transfer-Encoding": "chunked"},
        ),
    ),
    (
        "truncated (declares 1000, sends PDF)",
        request(
            "/verify-file",
            "POST",
            PDF,
            {"Content-Type": "application/octet-stream", "Content-Length": "1000"},
        ),
    ),
    (
        "extra bytes (declares 8, sends full PDF)",
        request(
            "/verify-file",
            "POST",
            PDF,
            {"Content-Type": "application/octet-stream", "Content-Length": "8"},
        ),
    ),
    (
        "oversize declaration (11 MB, sends PDF)",
        request(
            "/verify-file",
            "POST",
            PDF,
            {"Content-Type": "application/octet-stream", "Content-Length": str(11 * 1024 * 1024)},
        ),
    ),
]


def run_case(host, port, name, payload):
    print(f"\n=== {name} ===")
    print(f">>> {payload[:120]!r}{'...' if len(payload) > 120 else ''}")
    try:
        with socket.create_connection((host, port), timeout=5) as sock:
            sock.settimeout(15)
            sock.sendall(payload)
            data = b""
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                data += chunk
    except Exception as exc:
        print(f"<<< {type(exc).__name__}: {exc}")
        return
    head, _, body = data.partition(b"\r\n\r\n")
    status = head.split(b"\r\n", 1)[0]
    print(f"<<< {status.decode(errors='replace')}")
    print(f"<<< body {body.decode(errors='replace')!r}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="192.168.2.1")
    parser.add_argument("--port", type=int, default=80)
    parser.add_argument("--only", choices=["serial", "body"], help="run one group")
    args = parser.parse_args()

    groups = []
    if args.only in (None, "serial"):
        groups.append(("SERIAL", SERIAL_CASES))
    if args.only in (None, "body"):
        groups.append(("BODY", BODY_CASES))

    for title, cases in groups:
        print(f"\n######## {title} ########")
        for name, payload in cases:
            run_case(args.host, args.port, name, payload)


if __name__ == "__main__":
    main()
