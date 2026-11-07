import os
import json
import base64
import time
import re
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
DATA_JS_PATH = os.path.join(BASE_DIR, "data.js")
DB_JSON_PATH = os.path.join(BASE_DIR, "database.json")
SUBMISSIONS_PATH = os.path.join(BASE_DIR, "submissions.json")
DEPLOY_CONFIG_PATH = os.path.join(BASE_DIR, ".deploy_config.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)

TRACKED_ITEMS = [
    "index.html",
    "admin.html",
    "app.js",
    "data.js",
    "database.json",
    "styles.css",
    "server.py",
    "run_website.bat",
    "submissions.json",
    ".gitignore",
    "uploads"
]


def load_deploy_config():
    default_cfg = {
        "repoUrl": "https://github.com/rajaraveendartalks/raja.git",
        "branch": "main",
        "vercelDashboardUrl": "https://vercel.com/rajaraveendar/raja-u6fs",
        "liveSiteUrl": "https://raja-u6fs.vercel.app",
        "autoDeployOnSave": True,
        "githubToken": "",
        "lastDeployedAt": None,
        "lastDeployStatus": "Not deployed from Admin CMS yet"
    }
    if not os.path.exists(DEPLOY_CONFIG_PATH):
        save_deploy_config(default_cfg)
        return default_cfg
    try:
        with open(DEPLOY_CONFIG_PATH, "r", encoding="utf-8") as f:
            loaded = json.load(f)
            default_cfg.update(loaded)
            return default_cfg
    except Exception:
        return default_cfg


def save_deploy_config(cfg):
    with open(DEPLOY_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def run_git(args, env_extra=None, timeout=35):
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GCM_INTERACTIVE"] = "never"
    if env_extra:
        env.update(env_extra)
    proc = subprocess.run(
        ["git"] + args,
        cwd=BASE_DIR,
        capture_output=True,
        text=True,
        timeout=timeout,
        env=env
    )
    return proc.returncode, (proc.stdout or "").strip(), (proc.stderr or "").strip()


def get_git_status_summary():
    code, out, _ = run_git(["status", "-s"])
    lines = [ln for ln in out.splitlines() if ln.strip() and "pill/" not in ln and ".deploy_config.json" not in ln]
    uploads_files = []
    if os.path.exists(UPLOADS_DIR):
        uploads_files = [f for f in os.listdir(UPLOADS_DIR) if not f.startswith(".")]
    return {
        "pendingChangesCount": len(lines),
        "pendingFiles": lines[:20],
        "uploadsCount": len(uploads_files)
    }


def deploy_to_github_and_vercel(commit_msg=None):
    cfg = load_deploy_config()
    repo_url = cfg.get("repoUrl", "https://github.com/rajaraveendartalks/raja.git").strip()
    branch = cfg.get("branch", "main").strip() or "main"
    token = cfg.get("githubToken", "").strip()

    if not commit_msg:
        commit_msg = f"Admin CMS Live Update ({time.strftime('%Y-%m-%d %H:%M:%S')})"

    # Ensure git initialized and user configured
    if not os.path.exists(os.path.join(BASE_DIR, ".git")):
        run_git(["init"])
        run_git(["branch", "-M", branch])

    run_git(["config", "user.name", "Raja Raveendar Admin CMS"])
    run_git(["config", "user.email", "rajaraveendartalks@users.noreply.github.com"])
    run_git(["remote", "set-url", "origin", repo_url])

    # Stage tracked items
    existing_items = [item for item in TRACKED_ITEMS if os.path.exists(os.path.join(BASE_DIR, item))]
    run_git(["add", "-A"] + existing_items)

    # Commit if anything staged or changed
    run_git(["commit", "-m", commit_msg])

    # Build push URL (use token if provided, else standard remote URL)
    push_target = repo_url
    if token and repo_url.startswith("https://github.com/"):
        repo_path = repo_url.replace("https://github.com/", "")
        if not repo_path.endswith(".git"):
            repo_path += ".git"
        push_target = f"https://x-access-token:{token}@github.com/{repo_path}"

    code, out, err = run_git(["push", "--force", push_target, f"HEAD:{branch}"], timeout=45)

    # Mask token in any output
    if token:
        out = out.replace(token, "***")
        err = err.replace(token, "***")

    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    if code == 0:
        cfg["lastDeployedAt"] = now_str
        cfg["lastDeployStatus"] = f"✅ Deployed to GitHub ({branch}) & triggered Vercel build at {now_str}"
        save_deploy_config(cfg)
        return {
            "ok": True,
            "deployedAt": now_str,
            "message": "Successfully pushed to GitHub (rajaraveendartalks/raja)! Vercel is now building your live update (~15s).",
            "details": out or err
        }
    else:
        needs_auth = any(
            k in (err + out).lower()
            for k in ["authentication", "403", "denied", "credential", "could not read username", "logon failed"]
        )
        cfg["lastDeployStatus"] = f"⚠️ Deploy failed at {now_str}: {err or out}"
        save_deploy_config(cfg)
        return {
            "ok": False,
            "needsAuth": needs_auth,
            "error": err or out or "Git push failed",
            "message": "GitHub authentication required to push automatically. Please connect your GitHub account in the 🚀 Cloud Deploy tab."
        }


def load_submissions():
    if not os.path.exists(SUBMISSIONS_PATH):
        default_subs = {
            "guestMessages": [],
            "sponsorInquiries": [],
            "brandMessages": [],
            "creatorRegistrations": [],
            "internshipApplications": [],
            "vvipApplications": [],
            "viewerQuestions": [],
            "episodeComments": []
        }
        save_submissions(default_subs)
        return default_subs
    try:
        with open(SUBMISSIONS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_submissions(data):
    with open(SUBMISSIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def save_site_data(site_data):
    # Save to database.json
    with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(site_data, f, ensure_ascii=False, indent=2)

    # Also write directly to data.js so index.html always loads the latest data immediately
    js_content = (
        "// ============================================================================\n"
        "// AUTO-GENERATED BY RAJA RAVEENDAR ADMIN CMS BACKEND (server.py)\n"
        "// ============================================================================\n\n"
        "window.RR_DATA = "
        + json.dumps(site_data, ensure_ascii=False, indent=2)
        + ";\n"
    )
    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)


class RajaRaveendarBackendHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/submissions":
            subs = load_submissions()
            return self._send_json({"ok": True, "submissions": subs})
        if parsed.path == "/api/deploy/status":
            cfg = load_deploy_config()
            safe_cfg = dict(cfg)
            safe_cfg["hasGithubToken"] = bool(cfg.get("githubToken", "").strip())
            safe_cfg["githubToken"] = ""
            git_info = get_git_status_summary()
            return self._send_json({"ok": True, "config": safe_cfg, "git": git_info})
        if parsed.path == "/api/health":
            return self._send_json({"ok": True, "status": "Raja Raveendar Backend Running"})
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_len = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_len) if content_len > 0 else b"{}"

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception as e:
            return self._send_json({"ok": False, "error": f"Invalid JSON: {e}"}, 400)

        # 1. Admin Save Full Site Data (Episodes, Reels, Guests, Sponsors, Stats, Goodies)
        if parsed.path == "/api/admin/save-data":
            site_data = payload.get("data")
            if not site_data:
                return self._send_json({"ok": False, "error": "Missing data payload"}, 400)
            save_site_data(site_data)

            cfg = load_deploy_config()
            deploy_result = None
            if cfg.get("autoDeployOnSave"):
                deploy_result = deploy_to_github_and_vercel("Admin CMS Auto-Deploy Update")

            return self._send_json({
                "ok": True,
                "message": "Site data saved locally to database.json and data.js!",
                "deploy": deploy_result
            })

        # 1b. Explicit 1-Click Deploy to GitHub & Vercel
        if parsed.path == "/api/deploy/push":
            msg = payload.get("commitMessage") or "1-Click Admin CMS Deploy to GitHub & Vercel"
            res = deploy_to_github_and_vercel(msg)
            return self._send_json(res)

        # 1c. Save Cloud Deploy Settings
        if parsed.path == "/api/deploy/config":
            cfg = load_deploy_config()
            if "repoUrl" in payload and payload["repoUrl"].strip():
                cfg["repoUrl"] = payload["repoUrl"].strip()
            if "branch" in payload and payload["branch"].strip():
                cfg["branch"] = payload["branch"].strip()
            if "vercelDashboardUrl" in payload:
                cfg["vercelDashboardUrl"] = payload["vercelDashboardUrl"].strip()
            if "liveSiteUrl" in payload:
                cfg["liveSiteUrl"] = payload["liveSiteUrl"].strip()
            if "autoDeployOnSave" in payload:
                cfg["autoDeployOnSave"] = bool(payload["autoDeployOnSave"])
            if "githubToken" in payload:
                tok = payload["githubToken"].strip()
                if tok == "__CLEAR__":
                    cfg["githubToken"] = ""
                elif tok:
                    cfg["githubToken"] = tok
            save_deploy_config(cfg)
            return self._send_json({"ok": True, "message": "Cloud Deploy settings saved!"})

        # 1d. Trigger Browser Login via Git Credential Manager
        if parsed.path == "/api/deploy/github-browser-login":
            try:
                subprocess.Popen(
                    ["git", "credential-manager", "github", "login", "--web"],
                    cwd=BASE_DIR
                )
                return self._send_json({
                    "ok": True,
                    "message": "Opened GitHub authentication in your browser! Click Authorize, then click 🚀 1-Click Deploy."
                })
            except Exception as e:
                return self._send_json({"ok": False, "error": str(e)}, 500)

        # 2. Admin Image / File Upload (Base64 Data URL -> /uploads/<filename>)
        if parsed.path == "/api/upload":
            filename = payload.get("filename", f"upload_{int(time.time())}.jpg")
            data_url = payload.get("dataUrl", "")
            safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
            safe_name = f"{int(time.time())}_{safe_name}"

            if "," in data_url:
                _, b64_part = data_url.split(",", 1)
            else:
                b64_part = data_url

            file_bytes = base64.b64decode(b64_part)
            out_path = os.path.join(UPLOADS_DIR, safe_name)
            with open(out_path, "wb") as f:
                f.write(file_bytes)

            return self._send_json({
                "ok": True,
                "url": f"/uploads/{safe_name}",
                "filename": safe_name
            })

        # 3. Audience / Website Form Submissions
        if parsed.path == "/api/submit":
            sub_type = payload.get("type", "general")
            entry = payload.get("entry", {})
            entry["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
            subs = load_submissions()

            if sub_type in subs and isinstance(subs[sub_type], list):
                subs[sub_type].insert(0, entry)
            else:
                subs.setdefault(sub_type, []).insert(0, entry)

            save_submissions(subs)
            return self._send_json({"ok": True, "submissions": subs})

        # 4. Delete or Update Submission Status from Admin Inbox
        if parsed.path == "/api/admin/update-submissions":
            new_subs = payload.get("submissions")
            if isinstance(new_subs, dict):
                save_submissions(new_subs)
                return self._send_json({"ok": True})
            return self._send_json({"ok": False, "error": "Invalid submissions object"}, 400)

        return self._send_json({"ok": False, "error": "Unknown API endpoint"}, 404)


if __name__ == "__main__":
    port = 8090
    print("============================================================")
    print(" Raja Raveendar Website + Admin CMS Backend Running!")
    print(f" -> Main Website:    http://localhost:{port}/index.html")
    print(f" -> Admin Dashboard: http://localhost:{port}/admin.html")
    print("============================================================")
    server = ThreadingHTTPServer(("0.0.0.0", port), RajaRaveendarBackendHandler)
    server.serve_forever()
