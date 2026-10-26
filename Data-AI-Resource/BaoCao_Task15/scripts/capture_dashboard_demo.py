"""Automated screenshot capture for CyberSoft Resource Quality Dashboard via Chrome CDP."""

import asyncio
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import requests
import websockets


def wait_for_server(url: str, timeout: int = 25) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            r = requests.get(url, timeout=1)
            if r.status_code == 200:
                return True
        except Exception:
            time.sleep(0.5)
    return False


async def capture_cdp_screenshot(ws_url: str, output_path: Path):
    async with websockets.connect(ws_url, max_size=50 * 1024 * 1024) as ws:
        # Enable Page and Runtime domains
        await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
        await ws.recv()
        await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
        await ws.recv()

        print(
            "[CDP] Waiting for Streamlit DOM and Plotly components to finish loading..."
        )
        start_wait = time.time()
        ready = False
        msg_id = 10
        while time.time() - start_wait < 30:
            msg_id += 1
            check_req = {
                "id": msg_id,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": "document.querySelectorAll('.js-plotly-plot, [data-testid=\"stMetric\"], table').length"
                },
            }
            await ws.send(json.dumps(check_req))
            resp_raw = await ws.recv()
            resp = json.loads(resp_raw)
            if resp.get("id") == msg_id:
                count = resp.get("result", {}).get("result", {}).get("value", 0)
                if count and count >= 3:
                    print(f"[CDP] Detected {count} rendered visual elements in DOM!")
                    ready = True
                    break
            await asyncio.sleep(1.0)

        if not ready:
            print(
                "[WARN] Timeout waiting for specific elements, will capture current state..."
            )

        # Extra 3 seconds to let Plotly animations and gradients settle
        await asyncio.sleep(3.0)

        # 1. Capture Overview Screenshot
        print("[CDP] Capturing Overview Tab Screenshot...")
        req = {
            "id": 999,
            "method": "Page.captureScreenshot",
            "params": {"format": "png", "captureBeyondViewport": True},
        }
        await ws.send(json.dumps(req))
        while True:
            resp_raw = await ws.recv()
            resp = json.loads(resp_raw)
            if resp.get("id") == 999:
                img_bytes = base64.b64decode(resp["result"]["data"])
                output_path.write_bytes(img_bytes)
                print(
                    f"[CDP SUCCESS] Overview saved to: {output_path} ({len(img_bytes)} bytes)"
                )
                break

        # 2. Switch to Resource Catalog Tab
        print("[CDP] Clicking Resource Catalog Tab...")
        await ws.send(
            json.dumps(
                {
                    "id": 1001,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": "document.querySelectorAll('[data-testid=\"stTab\"]')[1].click()"
                    },
                }
            )
        )
        await ws.recv()
        await asyncio.sleep(2.0)

        catalog_img = output_path.parent / "Picture_15_Demo_Catalog.png"
        req = {
            "id": 1002,
            "method": "Page.captureScreenshot",
            "params": {"format": "png", "captureBeyondViewport": True},
        }
        await ws.send(json.dumps(req))
        while True:
            resp_raw = await ws.recv()
            resp = json.loads(resp_raw)
            if resp.get("id") == 1002:
                img_bytes = base64.b64decode(resp["result"]["data"])
                catalog_img.write_bytes(img_bytes)
                print(
                    f"[CDP SUCCESS] Catalog saved to: {catalog_img} ({len(img_bytes)} bytes)"
                )
                break

        # 3. Switch to Drill-Down & Error Audit Tab
        print("[CDP] Clicking Drill-Down & Error Audit Tab...")
        await ws.send(
            json.dumps(
                {
                    "id": 1003,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": "document.querySelectorAll('[data-testid=\"stTab\"]')[2].click()"
                    },
                }
            )
        )
        await ws.recv()
        await asyncio.sleep(2.5)

        drilldown_img = output_path.parent / "Picture_15_Demo_Drilldown.png"
        req = {
            "id": 1004,
            "method": "Page.captureScreenshot",
            "params": {"format": "png", "captureBeyondViewport": True},
        }
        await ws.send(json.dumps(req))
        while True:
            resp_raw = await ws.recv()
            resp = json.loads(resp_raw)
            if resp.get("id") == 1004:
                img_bytes = base64.b64decode(resp["result"]["data"])
                drilldown_img.write_bytes(img_bytes)
                print(
                    f"[CDP SUCCESS] Drilldown saved to: {drilldown_img} ({len(img_bytes)} bytes)"
                )
                break


def main():
    script_dir = Path(__file__).resolve().parent
    task15_dir = script_dir.parent
    app_path = task15_dir / "src" / "app.py"
    port = 8515
    cdp_port = 9333
    url = f"http://localhost:{port}"
    health_url = f"http://localhost:{port}/_stcore/health"

    output_img = task15_dir / "Picture_15_Demo_Dashboard.png"

    chrome_candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]
    browser_exe = None
    for cand in chrome_candidates:
        if os.path.exists(cand):
            browser_exe = cand
            break

    if not browser_exe:
        print("[ERROR] No suitable browser found for screenshot capture.")
        sys.exit(1)

    print(f"[START] Launching Streamlit on port {port}...")
    streamlit_cmd = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(app_path),
        f"--server.port={port}",
        "--server.headless=true",
        "--browser.serverAddress=localhost",
        "--server.enableCORS=false",
        "--server.enableXsrfProtection=false",
    ]

    st_proc = subprocess.Popen(
        streamlit_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(task15_dir),
    )

    chrome_proc = None
    try:
        print("[WAIT] Waiting for Streamlit server to be healthy...")
        if not wait_for_server(health_url, timeout=25):
            print("[ERROR] Streamlit server failed to start within timeout.")
            sys.exit(1)

        print(
            f"[START] Launching Headless Chrome with Remote Debugging on port {cdp_port}..."
        )
        chrome_cmd = [
            browser_exe,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            f"--remote-debugging-port={cdp_port}",
            "--window-size=1680,1200",
            url,
        ]
        chrome_proc = subprocess.Popen(
            chrome_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        cdp_json_url = f"http://localhost:{cdp_port}/json"
        print("[WAIT] Waiting for Chrome CDP endpoint...")
        if not wait_for_server(cdp_json_url, timeout=15):
            print("[ERROR] Chrome CDP endpoint not available.")
            sys.exit(1)

        tabs = requests.get(cdp_json_url).json()
        target_tab = None
        for tab in tabs:
            if tab.get("type") == "page":
                target_tab = tab
                break

        if not target_tab:
            print("[ERROR] No page tab found in Chrome.")
            sys.exit(1)

        ws_url = target_tab["webSocketDebuggerUrl"]
        print(f"[OK] Connecting to WebSocket: {ws_url}")
        asyncio.run(capture_cdp_screenshot(ws_url, output_img))

    finally:
        print("[CLEANUP] Stopping Chrome and Streamlit processes...")
        if chrome_proc:
            chrome_proc.terminate()
            try:
                chrome_proc.wait(timeout=3)
            except Exception:
                chrome_proc.kill()
        if st_proc:
            st_proc.terminate()
            try:
                st_proc.wait(timeout=3)
            except Exception:
                st_proc.kill()
        print("[CLEANUP] Done.")


if __name__ == "__main__":
    main()
