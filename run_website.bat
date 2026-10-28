@echo off
cd /d "%~dp0"
echo Starting Raja Raveendar Website + Admin CMS Backend on http://localhost:8090 ...
start http://localhost:8090/index.html
start http://localhost:8090/admin.html
python server.py
