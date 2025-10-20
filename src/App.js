import React, { useEffect, useState } from "react";
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
  const [ipData, setIpData] = useState([]);
  const [currentIp, setCurrentIp] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  // Fetch IP data from Flask API
  const fetchIpData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/ip-history");
      const data = response.data;

      setIpData(
        data.map((item) => ({
          ip: item.ip,
          timestamp: new Date(item.timestamp).toLocaleTimeString(),
        }))
      );

      if (data.length > 0) {
        setCurrentIp(data[data.length - 1].ip);
        setLastUpdated(
          new Date(data[data.length - 1].timestamp).toLocaleString()
        );
      }
    } catch (error) {
      console.error("Error fetching IP data:", error);
      setLastUpdated("Invalid Date");
    }
  };

  useEffect(() => {
    fetchIpData();
    const interval = setInterval(fetchIpData, 10000); // refresh every 10 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Dynamic IP Monitoring Dashboard
      </h1>

      <h3>Current Public IP</h3>
      <p style={{ fontSize: "18px" }}>{currentIp || "Loading..."}</p>
      <p>
        <strong>Last Updated:</strong> {lastUpdated || "Invalid Date"}
      </p>

      <h3 style={{ marginTop: "40px" }}>IP Change Timeline</h3>
      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer>
          <LineChart data={ipData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis dataKey="ip" hide />
            <Tooltip />
            <Line type="monotone" dataKey="ip" stroke="#8884d8" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;