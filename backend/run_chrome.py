import subprocess
import time
import os
import httpx

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATA_DIR = r"C:\Users\AYUSH\AppData\Local\Google\Chrome\User Data Debug"
ACTIVE_PORT_FILE = r"C:\Users\AYUSH\AppData\Local\Google\Chrome\User Data\DevToolsActivePort"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.dirname(ACTIVE_PORT_FILE), exist_ok=True)

cmd = [
    CHROME_PATH,
    "--remote-debugging-port=9222",
    f"--user-data-dir={DATA_DIR}",
    "--remote-allow-origins=*",
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new"
]

print("Launching Chrome...")
proc = subprocess.Popen(cmd)

# Wait for port 9222 to be active
for _ in range(20):
    time.sleep(0.5)
    try:
        r = httpx.get("http://127.0.0.1:9222/json/version", timeout=1.0)
        if r.status_code == 200:
            data = r.json()
            ws_url = data.get("webSocketDebuggerUrl", "")
            browser_path = ws_url.split("9222")[-1] if "9222" in ws_url else "/devtools/browser"
            
            # Write DevToolsActivePort file
            with open(ACTIVE_PORT_FILE, "w", encoding="utf-8") as f:
                f.write(f"9222\n{browser_path}\n")
                
            print(f"Chrome running on port 9222! Wrote {ACTIVE_PORT_FILE}")
            break
    except Exception:
        pass

proc.wait()
