'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data: any[] = [];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-elevated px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={`tt-${i}`} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground text-xs">{p.name === 'semaine' ? 'Cette semaine' : 'Semaine préc.'}</span>
          <span className="font-bold tabular-nums text-foreground ml-auto pl-4">{p.value.toLocaleString('fr-FR')} FCFA</span>
        </div>
      ))}
    </div>
  );
}

export default function CAAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSemaine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="gradPrecedente" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.12} />
            <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="jour" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="precedente" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gradPrecedente)" name="precedente" />
        <Area type="monotone" dataKey="semaine" stroke="var(--primary)" strokeWidth={2.5} fill="url(#gradSemaine)" name="semaine" dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--primary)' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
