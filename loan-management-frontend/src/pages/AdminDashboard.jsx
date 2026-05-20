import React, { useEffect, useState } from "react";
import axios from "axios";

import LoanTrendChart from "../components/charts/LoanTrendChart";
import RevenueChart from "../components/charts/RevenueChart";
import StatusPieChart from "../components/charts/StatusPieChart";
import LoanTracker from "../components/LoanTracker";

const AdminDashboard = () => {

  const [stats, setStats] = useState({
    totalLoans: 0,
    approvedLoans: 0,
    pendingLoans: 0,
    rejectedLoans: 0,
  });

  useEffect(() => {

    const fetchStats = async () => {
      try {

        const res = await axios.get(
          "http://localhost:5001/api/dashboard/stats"
        );

        setStats(res.data);

      } catch (error) {
        console.log("Dashboard Error:", error);
      }
    };

    fetchStats();

  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">

      <h1 className="text-3xl font-bold mb-6">
        Loan Analytics Dashboard
      </h1>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
          <h2 className="text-gray-400">Total Loans</h2>
          <p className="text-3xl font-bold">
            {stats.totalLoans}
          </p>
        </div>

        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
          <h2 className="text-gray-400">Approved Loans</h2>
          <p className="text-3xl font-bold text-green-400">
            {stats.approvedLoans}
          </p>
        </div>

        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
          <h2 className="text-gray-400">Pending Loans</h2>
          <p className="text-3xl font-bold text-yellow-400">
            {stats.pendingLoans}
          </p>
        </div>

        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
          <h2 className="text-gray-400">Rejected Loans</h2>
          <p className="text-3xl font-bold text-red-400">
            {stats.rejectedLoans}
          </p>
        </div>

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg">
          <LoanTrendChart />
        </div>

        <div className="bg-gray-800 p-5 rounded-2xl shadow-lg">
          <RevenueChart />
        </div>

      </div>

      {/* PIE CHART */}
      <div className="mt-6 bg-gray-800 p-5 rounded-2xl shadow-lg">
        <StatusPieChart />
      </div>

      <div className="mt-6">
        <LoanTracker loanId="YOUR_LOAN_ID_HERE" />
      </div>

    </div>
  );
};

export default AdminDashboard;