import React, { useEffect, useState } from "react";
import api from "../../services/api";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const RevenueChart = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [revRes, trendRes] = await Promise.all([
          api.get('/dashboard/revenue'),
          api.get('/dashboard/loan-trends')
        ]);
        setRevenueData(revRes.data);
        setTrendData(trendRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>Loading analytics...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>💰 Monthly Revenue</h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <Tooltip 
                contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F1F5F9' }}
                itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div style={{ textAlign: 'center', color: '#475569', padding: '60px 0' }}>No revenue data yet</div>}
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>📈 Loan Applications Trend</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <Tooltip 
                contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F1F5F9' }} 
                cursor={{ fill: 'rgba(59,130,246,0.05)' }} 
              />
              <Bar dataKey="loans" fill="url(#barGradTrend)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGradTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={{ textAlign: 'center', color: '#475569', padding: '60px 0' }}>No trend data yet</div>}
      </div>
    </div>
  );
};

export default RevenueChart;