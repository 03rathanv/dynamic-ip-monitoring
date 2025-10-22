import React from "react";

const IPCard = ({ currentIP, lastUpdated }) => (
  <div className="bg-white shadow-md rounded-2xl p-4 text-center">
    <h2 className="text-xl font-semibold">Current Public IP</h2>
    <p className="text-2xl font-mono text-blue-600 mt-2">{currentIP || "Loading..."}</p>
    <p className="text-gray-500 text-sm mt-2">
      Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}
    </p>
  </div>
);

export default IPCard;
