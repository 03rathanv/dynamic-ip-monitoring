import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [ipHistory, setIpHistory] = useState([]);
  const [currentIp, setCurrentIp] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [ipChanged, setIpChanged] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const previousIpRef = useRef("");

  const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resCurrent = await axios.get(`${API_BASE}/current-ip`);
        const newIp = resCurrent.data.current_ip;
        const updatedTime = resCurrent.data.last_updated;

        if (previousIpRef.current && previousIpRef.current !== newIp) {
          setIpChanged(true);
          setTimeout(() => setIpChanged(false), 3000);
        }

        previousIpRef.current = newIp;
        setCurrentIp(newIp);
        setLastUpdated(updatedTime ? new Date(updatedTime).toLocaleString() : "No data");

        const resHistory = await axios.get(`${API_BASE}/ip-history`);
        const data = resHistory.data || [];

        const formattedData = data.map((item) => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString(),
          ip: item.ip,
        }));

        setIpHistory(formattedData.reverse());
      } catch (err) {
        console.error("Error fetching IP data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  const CustomDot = ({ cx, cy, index }) => {
    const isLast = index === ipHistory.length - 1;
    const radius = isLast ? 6 : 4;
    const color = isLast ? "#ff77ff" : "#8884d8";

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={color}
        stroke={color}
        style={{
          animation: isLast ? "glowDot 1.2s infinite alternate" : "none",
        }}
      />
    );
  };

  const tabs = [
    { name: "home", icon: "🏠", label: "Home" },
    { name: "history", icon: "⏰", label: "History" },
    { name: "settings", icon: "⚙️", label: "Settings" },
  ];

  // Particle Animation
  useEffect(() => {
    const canvas = document.getElementById("particle-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        color: `rgba(255,255,255,${Math.random() * 0.5 + 0.1})`,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0;
        if (p.y < 0) p.y = canvas.height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="app-container">
      <canvas id="particle-canvas" style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none"
      }}></canvas>

      {/* Sidebar */}
      <div className="sidebar">
        <h2>🌐 IP Monitor</h2>
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`tab-button ${activeTab === tab.name ? "active" : ""}`}
            >
              <span className="icon">{tab.icon}</span>
              <span className="label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>
          {activeTab === "home" && "Dynamic IP Monitoring Dashboard"}
          {activeTab === "history" && "IP Change History"}
          {activeTab === "settings" && "Settings"}
        </h1>

        {activeTab === "home" && (
          <>
            <div className="ip-card">
              <h2>Current Public IP</h2>
              <div className="ip-display">
                <p className="ip-number">{currentIp || "Loading..."}</p>
                {ipChanged && <span className="new-badge">NEW</span>}
              </div>
              <div className="signal-bars">
                {[4, 3, 2, 1].map((level, index) => (
                  <div
                    key={level}
                    className="signal-bar"
                    style={{
                      height: `${level * 6}px`,
                      animation:
                        level <= (ipChanged ? 4 : 2)
                          ? `pulseSignal 1.2s ${index * 0.2}s infinite`
                          : "none",
                    }}
                  />
                ))}
              </div>
              <p className="last-updated">
                <strong>Last Updated:</strong> {lastUpdated}
              </p>
            </div>

            <div className="chart-card">
              <h2>IP Change Timeline</h2>
              <div className="chart-container">
                {ipHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ipHistory}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.2)"
                      />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#f8fafc"
                        fontSize={12}
                        tick={{ fill: "#f0f9ff", fontWeight: "500" }}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.3)",
                          color: "#fff",
                          fontSize: "13px",
                        }}
                        labelStyle={{ color: "#fff", fontWeight: "500" }}
                        formatter={(value) => [value, "IP"]}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="ip"
                        stroke="#c084fc"
                        dot={<CustomDot />}
                        strokeWidth={2.5}
                        style={{ animation: "glowLine 2s infinite alternate" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="loading-text">Loading IP history...</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Styles */}
      <style>
        {`
          /* Container */
          .app-container {
            display: flex;
            min-height: 100vh;
            font-family: 'Inter', Arial, sans-serif;
            background: linear-gradient(135deg, #5b21b6, #3b82f6);
            overflow: hidden;
            position: relative;
          }

          /* Sidebar */
          .sidebar {
            width: 220px;
            background-color: rgba(0,0,0,0.25);
            backdrop-filter: blur(12px);
            padding: 25px 15px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: 2px 0 12px rgba(0,0,0,0.3);
            z-index: 10;
          }
          .sidebar h2 {
            font-size: 22px;
            font-weight: 700;
            color: white;
            margin-bottom: 15px;
            text-align: center;
            letter-spacing: 1px;
            text-shadow: 0 0 8px rgba(255,255,255,0.5);
          }
          .tab-button {
            display: flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            border: none;
            color: #fff;
            padding: 8px 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: background 0.3s;
            text-shadow: 0 0 6px rgba(255,255,255,0.4);
          }
          .tab-button.active {
            background: rgba(255,255,255,0.2);
          }

          /* Main Content */
          .main-content {
            flex: 1;
            padding: 40px;
            position: relative;
            z-index: 10;
            overflow-y: auto;
          }
          .main-content h1 {
            font-size: 28px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 30px;
            color: #ffffff;
            text-shadow: 0 0 15px rgba(255,255,255,0.6);
            letter-spacing: 1px;
          }

          /* IP Card */
          .ip-card {
            max-width: 90%;
            margin: 0 auto 30px auto;
            padding: 25px;
            border-radius: 16px;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(12px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            text-align: center;
            line-height: 1.4;
            position: relative;
            overflow: hidden;
          }
          .ip-card h2 {
            font-size: 20px;
            color: #f0f9ff;
            font-weight: 600;
            margin-bottom: 6px;
          }
          .ip-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .ip-number {
            font-size: 24px;
            margin: 0;
            font-weight: 700;
            background: linear-gradient(90deg, #ff77ff, #7dd3fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 8px rgba(255,255,255,0.3);
          }
          .new-badge {
            background-color: #22c55e;
            color: #fff;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            animation: blink 1s linear infinite;
          }
          .signal-bars {
            display: flex;
            gap: 4px;
            margin-top: 6px;
            justify-content: center;
          }
          .signal-bar {
            width: 6px;
            background-color: #22c55e;
            border-radius: 2px;
            transform-origin: bottom center;
          }
          .last-updated {
            font-size: 15px;
            color: #d1d5db;
            font-weight: 500;
            margin-top: 6px;
          }

          /* Chart Card */
          .chart-card {
            max-width: 90%;
            margin: 0 auto 40px auto;
            padding: 20px;
            border-radius: 16px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
          }
          .chart-card h2 {
            font-size: 22px;
            margin-bottom: 15px;
            text-align: center;
            color: #f0f9ff;
            font-weight: 600;
            text-shadow: 0 0 8px rgba(255,255,255,0.4);
          }
          .loading-text {
            text-align: center;
            color: #e0e7ff;
            font-size: 15px;
          }

          /* Animations */
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes pulseSignal {
            0% { transform: scaleY(1); opacity: 0.6; }
            50% { transform: scaleY(1.3); opacity: 1; }
            100% { transform: scaleY(1); opacity: 0.6; }
          }
          @keyframes glowLine {
            0%,100% { filter: drop-shadow(0 0 2px #c084fc); }
            50% { filter: drop-shadow(0 0 8px #c084fc); }
          }
          @keyframes glowDot {
            0%,100% { r: 4; opacity: 0.8; }
            50% { r: 6; opacity: 1; }
          }

          /* Responsive */
          @media (max-width: 768px) {
            .sidebar {
              width: 100%;
              flex-direction: row;
              justify-content: space-around;
              padding: 10px 0;
            }
            .main-content {
              padding: 20px 10px;
            }
            .ip-card, .chart-card {
              padding: 15px;
            }
            .ip-number {
              font-size: 20px;
            }
            .last-updated {
              font-size: 14px;
            }
            .chart-card h2, .ip-card h2 {
              font-size: 18px;
            }
          }

          @media (max-width: 480px) {
            .ip-number {
              font-size: 18px;
            }
            .last-updated {
              font-size: 13px;
            }
            .chart-card h2, .ip-card h2 {
              font-size: 16px;
            }
          }
        `}
      </style>
    </div>
  );
}

export default App;
