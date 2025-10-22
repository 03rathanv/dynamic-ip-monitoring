import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const IPChart = ({ data }) => (
  <div className="bg-white shadow-md rounded-2xl p-4 mt-6">
    <h2 className="text-lg font-semibold mb-2 text-center">IP Change Timeline</h2>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="timestamp" />
        <YAxis hide />
        <Tooltip />
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey="ip" stroke="#2563eb" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default IPChart;
