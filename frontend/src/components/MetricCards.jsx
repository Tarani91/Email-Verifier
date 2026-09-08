import React from 'react';
import { Mail, CheckCircle, XCircle, Copy, AlertTriangle, Users, Building, ShieldAlert, ServerOff } from 'lucide-react';

export default function MetricCards({ stats, total }) {
  if (!stats) return null;

  const metrics = [
    {
      title: 'Total Emails',
      value: total || 0,
      icon: Mail,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Valid Emails',
      value: stats.valid || 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Invalid Emails',
      value: stats.invalid || 0,
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Duplicate Emails',
      value: stats.duplicate || 0,
      icon: Copy,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Disposable Domains',
      value: stats.disposable || 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Role Accounts',
      value: stats.role || 0,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Business Emails',
      value: stats.business || 0,
      icon: Building,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Free Providers',
      value: stats.free || 0,
      icon: ShieldAlert,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'No MX Server',
      value: stats.no_mx || 0,
      icon: ServerOff,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 my-6">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        const pct = total > 0 ? ((m.value / total) * 100).toFixed(1) : 0;

        return (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {m.title}
              </span>
              <div className={`p-2 rounded-xl border ${m.bg} ${m.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-100 mb-0.5">
                {m.value.toLocaleString()}
              </div>
              <span className="text-xs font-medium text-slate-400">
                {m.title === 'Total Emails' ? 'Uploaded' : `${pct}% of total`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
