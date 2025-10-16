import React, { useEffect, useState } from "react";
import axios from "axios";
import IPCard from "./components/IPCard";
import IPChart from "./components/IPChart";
import "./App.css";

function App() {
  const [ipData, setIpData] = useState([]);
  const [currentIP, setCurrentIP] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  // Fetch IP history from Flask backend
  const fetchIPData = async () => {
    try {
      const res = await axios.get("https://dynamic-ip-monitoring.onrender.com/api/ip-history");
      const data = res.data.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp).toLocaleTimeString(),
      }));

      setIpData(data);

      if (data.length > 0) {
        const latest = data[data.length - 1];
        setCurrentIP(latest.ip);
        setLastUpdated(latest.timestamp);
      }
    } catch (error) {
      console.error("Error fetching IP history:", error);
    }
  };

  useEffect(() => {
    fetchIPData();
    const interval = setInterval(fetchIPData, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">
        Dynamic IP Monitoring Dashboard
      </h1>
      <IPCard currentIP={currentIP} lastUpdated={lastUpdated} />
      <IPChart data={ipData} />
    </div>
  );
}

export default App;

fetch('http://localhost:5000/api/endpoint')


