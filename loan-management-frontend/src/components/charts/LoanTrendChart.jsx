import React, { useEffect, useState } from "react";
import api from "../../services/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const LoanTrendChart = () => {

  const [data, setData] = useState([]);

  useEffect(() => {

    const fetchData = async () => {
      try {

        const res = await api.get(
          "/dashboard/loan-trends"
        );

        setData(res.data);

      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Loan Trends
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="loans"
            stroke="#00ff99"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LoanTrendChart;