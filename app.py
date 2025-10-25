from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import requests, os, atexit, yagmail
from dotenv import load_dotenv

# --------------------------
# Load environment variables
# --------------------------
load_dotenv()
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
MONGO_URI = os.environ.get("MONGO_URI")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Validate environment variables
if not all([EMAIL_USER, EMAIL_PASS, MONGO_URI, BOT_TOKEN, CHAT_ID]):
    raise ValueError("Missing one or more required environment variables!")

# --------------------------
# Flask App Setup
# --------------------------
app = Flask(__name__)
CORS(app)

# --------------------------
# MongoDB Connection
# --------------------------
client = MongoClient(MONGO_URI)
db = client["ip_monitor"]
collection = db["ip_logs"]

# --------------------------
# Send Email Alert
# --------------------------
def send_email_alert(new_ip):
    try:
        yag = yagmail.SMTP(EMAIL_USER, EMAIL_PASS)
        yag.send(
            to=EMAIL_USER,
            subject="🚨 IP Address Changed!",
            contents=f"Your new public IP is: {new_ip}"
        )
        print(f"[EMAIL] Sent alert for new IP: {new_ip}")
    except Exception as e:
        print("[ERROR] Failed to send email:", e)

# --------------------------
# Send Telegram Message
# --------------------------
def send_telegram_message(message):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": CHAT_ID, "text": message}
    try:
        response = requests.post(url, data=payload)
        if response.status_code == 200:
            print("[TELEGRAM] Message sent!")
        else:
            print("[TELEGRAM] Failed to send:", response.text)
    except Exception as e:
        print("[TELEGRAM] Error:", e)

# --------------------------
# Get Current Public IP
# --------------------------
def get_public_ip():
    try:
        return requests.get("https://api.ipify.org").text
    except Exception as e:
        print("[ERROR] Fetching IP failed:", e)
        return None

# --------------------------
# Check & Log IP Changes
# --------------------------
def check_ip_change():
    current_ip = get_public_ip()
    if not current_ip:
        print("[WARNING] Could not fetch current IP.")
        return

    last_logs = list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(2))
    last_ip = last_logs[0]["ip"] if last_logs else None

    if current_ip != last_ip:
        timestamp = datetime.now(timezone.utc).isoformat()  # store as ISO string
        collection.insert_one({"ip": current_ip, "timestamp": timestamp})
        print(f"[UPDATE] IP changed to {current_ip}")
        send_telegram_message(f"🚨 IP Address Changed! New IP: {current_ip}")
        send_email_alert(current_ip)
    else:
        print("[INFO] IP unchanged.")

# --------------------------
# Scheduler: every 5 minutes
# --------------------------
scheduler = BackgroundScheduler()
scheduler.add_job(check_ip_change, "interval", minutes=5)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# --------------------------
# Helper: Force ISO string
# --------------------------
def to_iso(ts):
    if isinstance(ts, str):
        return ts
    elif isinstance(ts, datetime):
        return ts.replace(tzinfo=timezone.utc).isoformat()
    else:
        return str(ts)

# --------------------------
# Flask Routes
# --------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Dynamic IP Monitor API is running!"})

@app.route("/api/current-ip", methods=["GET"])
def get_current_ip():
    logs = list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(2))
    if logs:
        current_ip = logs[0]["ip"]
        previous_ip = logs[1]["ip"] if len(logs) > 1 else None
        last_updated = to_iso(logs[0]["timestamp"])
        return jsonify({
            "current_ip": current_ip,
            "previous_ip": previous_ip,
            "last_updated": last_updated
        })
    else:
        return jsonify({'error': 'No IP found'}), 404

@app.route("/api/ip-history", methods=["GET"])
def get_ip_history():
    logs = list(collection.find({}, {"_id": 0}).sort("timestamp", -1))
    for log in logs:
        log["timestamp"] = to_iso(log["timestamp"])
    return jsonify(logs)

# --------------------------
# Run Flask Server
# --------------------------
if __name__ == "__main__":
    check_ip_change()  # run once on startup
    app.run(debug=True, use_reloader=False, port=5000)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

    
