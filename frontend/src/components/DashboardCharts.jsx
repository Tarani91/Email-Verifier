import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = {
  Valid: '#10b981',
  Invalid: '#f43f5e',
  Duplicate: '#a855f7',
  Disposable: '#f59e0b',
  Role: '#6366f1',
  Free: '#14b8a6',
  Business: '#3b82f6',
  'No MX': '#f97316'
};

export default function DashboardCharts({ stats }) {
  if (!stats) return null;

  const pieData = [
    { name: 'Valid', value: stats.valid || 0, color: COLORS.Valid },
    { name: 'Invalid', value: stats.invalid || 0, color: COLORS.Invalid },
    { name: 'Duplicate', value: stats.duplicate || 0, color: COLORS.Duplicate },
    { name: 'Disposable', value: stats.disposable || 0, color: COLORS.Disposable },
    { name: 'Role', value: stats.role || 0, color: COLORS.Role },
    { name: 'No MX', value: stats.no_mx || 0, color: COLORS['No MX'] }
  ].filter(item => item.value > 0);

  const barData = [
    { name: 'Business', count: stats.business || 0, fill: COLORS.Business },
    { name: 'Free', count: stats.free || 0, fill: COLORS.Free },
    { name: 'Role', count: stats.role || 0, fill: COLORS.Role },
    { name: 'Disposable', count: stats.disposable || 0, fill: COLORS.Disposable },
    { name: 'No MX', count: stats.no_mx || 0, fill: COLORS['No MX'] },
    { name: 'Invalid', count: stats.invalid || 0, fill: COLORS.Invalid },
    { name: 'Duplicate', count: stats.duplicate || 0, fill: COLORS.Duplicate },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* Pie Chart Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h4 className="text-base font-bold text-slate-100 mb-4">Email Status Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                itemStyle={{ color: '#cbd5e1' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h4 className="text-base font-bold text-slate-100 mb-4">Quality Breakdown</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
