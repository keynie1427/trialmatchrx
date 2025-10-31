"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    unreviewed: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const snapshot = await getDocs(collection(db, "contacts"));
      const docs = snapshot.docs.map((d) => d.data());
      const total = docs.length;
      const reviewed = docs.filter((d) => d.reviewed).length;
      const unreviewed = total - reviewed;

      // aggregate by day
      const counts: Record<string, number> = {};
      docs.forEach((d) => {
        const ts = d.createdAt?.toDate ? d.createdAt.toDate() : null;
        if (ts) {
          const day = ts.toISOString().split("T")[0];
          counts[day] = (counts[day] || 0) + 1;
        }
      });

      const data = Object.entries(counts)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => (a.day > b.day ? 1 : -1))
        .slice(-7); // last 7 days

      setStats({ total, reviewed, unreviewed });
      setChartData(data);
    };

    loadStats();
  }, []);

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-8">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Dashboard Summary</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Total Inquiries</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Reviewed</p>
          <p className="text-2xl font-bold text-green-700">{stats.reviewed}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Unreviewed</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.unreviewed}</p>
        </div>
      </div>

      <h3 className="text-lg font-medium mb-2 text-gray-700">Submissions – Last 7 Days</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}