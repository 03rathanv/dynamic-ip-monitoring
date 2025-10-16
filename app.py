from flask import Flask, jsonify
from pymongo import MongoClient
from apscheduler.schedulers.background import BackgroundScheduler
import requests, os
from datetime import datetime
from dotenv import load_dotenv
import yagmail
import atexit
from flask_cors import CORS

# --------------------------
# Load environment variables
# --------------------------
load_dotenv()

# --------------------------
# Flask App Setup
# --------------------------
app = Flask(__name__)
CORS(app)  # Apply CORS AFTER app is created

# --------------------------
# MongoDB Connection
# --------------------------
client = MongoClient(os.getenv("MONGO_URI=mongodb+srv://rathan_user:rathanspoorthi@cluster0.bmhjl6x.mongodb.net/ip_monitor?retryWrites=true&w=majority&tls=true&ssl=true"))
db = client["ip_monitor"]
collection = db["ip_logs"]

# --------------------------
# Function: Send Email Alert
# --------------------------
def send_email_alert(new_ip):
    try:
        yag = yagmail.SMTP(os.getenv("kvrathan2718@gmail.com"), os.getenv("Rathanspoorthi"))
        yag.send(
            to=os.getenv("kvrathan2718@gmail.com"),
            subject="🚨 IP Address Changed!",
            contents=f"Your new public IP is: {new_ip}"
        )
        print(f"[EMAIL] Sent alert for new IP: {new_ip}")
    except Exception as e:
        print("[ERROR] Failed to send email:", e)

# --------------------------
# Function: Get Current Public IP
# --------------------------
def get_public_ip():
    try:
        return requests.get("https://api.ipify.org").text
    except Exception as e:
        print("[ERROR] Fetching IP failed:", e)
        return None

# --------------------------
# Function: Check & Log IP Changes
# --------------------------
def check_ip_change():
    current_ip = get_public_ip()
    if not current_ip:
        print("[WARNING] Could not fetch current IP.")
        return

    last_entry = collection.find_one(sort=[("timestamp", -1)])

    if not last_entry or last_entry["ip"] != current_ip:
        collection.insert_one({
            "ip": current_ip,
            "timestamp": datetime.now().isoformat()  # JSON serializable
        })
        print(f"[UPDATE] IP changed to {current_ip}")
        send_email_alert(current_ip)
    else:
        print("[INFO] IP unchanged.")

# --------------------------
# Scheduler: Check every 5 minutes
# --------------------------
scheduler = BackgroundScheduler()
scheduler.add_job(check_ip_change, "interval", minutes=5)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# --------------------------
# Flask Routes
# --------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Dynamic IP Monitor API is running!"})

@app.route("/api/ip-history", methods=["GET"])
def get_ip_history():
    logs = list(collection.find({}, {"_id": 0}))
    return jsonify(logs)

@app.route("/api/ip", methods=["GET"])
def get_ip():
    latest_log = collection.find_one(sort=[('_id', -1)])
    if latest_log:
        return jsonify({
            'current_ip': latest_log['ip'], 
            'time': latest_log['timestamp']
        })
    else:
        return jsonify({'error': 'No IP found'}), 404

# --------------------------
# Run Flask Server
# --------------------------
if __name__ == "__main__":
    check_ip_change()  # Run once at startup
    app.run(debug=True)
