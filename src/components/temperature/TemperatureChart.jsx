import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

export default function TemperatureChart({ data = [], height = 300 }) {
  // Sort chronologically for the graph
  const chartData = [...data]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((d) => ({
      ...d,
      timeLabel: d.timeFormatted || new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: parseFloat(Number(d.temperature).toFixed(1))
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const isBreach = item.temp < 2.0 || item.temp > 8.0;
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-800 space-y-1">
          <div className="font-semibold text-slate-300">{item.timeLabel}</div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Recorded Temp:</span>
            <span
              className={`font-mono font-bold ${
                isBreach ? 'text-rose-400 font-black' : 'text-emerald-400'
              }`}
            >
              {item.temp}°C
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Unit: {item.unit || 'Cold Storage'}</div>
          {isBreach && (
            <div className="mt-1 pt-1 border-t border-slate-800 text-rose-400 font-semibold">
              ⚠️ Cold-Chain Breach Detected
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500"></span>
            <span>Safe Range (2.0°C – 8.0°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500"></span>
            <span>Threshold Excursion Limit</span>
          </div>
        </div>
        <span className="font-mono text-[11px]">Last 24 Hours Telemetry</span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 12]}
              ticks={[0, 2, 4, 6, 8, 10, 12]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              unit="°C"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Safe 2°C - 8°C Zone shading */}
            <ReferenceArea
              y1={2.0}
              y2={8.0}
              fill="#10b981"
              fillOpacity={0.06}
            />

            {/* Critical boundaries */}
            <ReferenceLine
              y={8.0}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Upper Limit 8°C', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={2.0}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Lower Limit 2°C', fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }}
            />

            <Line
              type="monotone"
              dataKey="temp"
              stroke="#0f766e"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const isBreach = payload.temp < 2.0 || payload.temp > 8.0;
                if (isBreach) {
                  return (
                    <circle
                      key={`dot-${props.index}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${props.index}`}
                    cx={cx}
                    cy={cy}
                    r={2.5}
                    fill="#0f766e"
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={{ r: 6, fill: '#0f766e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
