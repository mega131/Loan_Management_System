import React, { useEffect, useState } from "react";
import api from "../../services/api";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#00C49F", "#FFBB28", "#FF4444"];

const StatusPieChart = () => {

  const [data, setData] = useState([]);

  useEffect(() => {

    const fetchStatus = async () => {
      try {

        const res = await api.get(
          "/dashboard/status-distribution"
        );

        setData(res.data);

      } catch (error) {
        console.log(error);
      }
    };

    fetchStatus();

  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Loan Status Distribution
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            outerRadius={120}
            label
          >

            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}

          </Pie>

          <Tooltip />

        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusPieChart;