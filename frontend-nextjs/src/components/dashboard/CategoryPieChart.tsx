'use client';
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppConfig } from '@/contexts/ConfigContext';

const COLORS = ['#1D4ED8', '#F97316', '#16A34A', '#9333EA', '#EF4444', '#EAB308'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
  total: number;
}

function CustomTooltip({ active, payload, total }: CustomTooltipProps) {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';
  if (!active || !payload?.length || total === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-card border border-border rounded-xl shadow-elevated px-3 py-2 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="font-semibold text-foreground">{item.name}</span>
      </div>
      <p className="tabular-nums text-muted-foreground">{item.value.toLocaleString('fr-FR')} {devise}</p>
      <p className="text-muted-foreground">{((item.value / total) * 100).toFixed(1)}%</p>
    </div>
  );
}

interface CategoryPieChartProps {
  data: { name: string; value: number }[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item, index) => ({
    ...item,
    id: index,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
            {chartData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {chartData.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-muted-foreground flex-1 truncate">{item.name}</span>
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
