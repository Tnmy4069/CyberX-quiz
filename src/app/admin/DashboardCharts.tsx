'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardChartsProps {
  trendData: Array<{ date: string; count: number }>;
  performanceData: Array<{
    quizName: string;
    avgScore: number;
    totalMarks: number;
    completionRate: number;
  }>;
}

export default function DashboardCharts({ trendData, performanceData }: DashboardChartsProps) {
  return (
    <div className="space-y-8">
      {/* Top row charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Line Chart */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold tracking-tight mb-4 text-foreground">
            Submission Trend (Last 7 Days)
          </h3>
          <div className="h-[300px] w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No submissions found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="date" className="text-xs font-semibold text-muted-foreground" />
                  <YAxis className="text-xs font-semibold text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Submissions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quiz Performance Bar Chart */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold tracking-tight mb-4 text-foreground">
            Average Score vs Total Marks
          </h3>
          <div className="h-[300px] w-full">
            {performanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No active quizzes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="quizName" className="text-xs font-semibold text-muted-foreground" />
                  <YAxis className="text-xs font-semibold text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend className="text-xs font-semibold" />
                  <Bar dataKey="avgScore" name="Avg Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalMarks" name="Total Marks" fill="hsl(var(--secondary-foreground))" opacity={0.15} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row chart */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold tracking-tight mb-4 text-foreground">
          Quiz Completion & Engagement Rate (%)
        </h3>
        <div className="h-[300px] w-full">
          {performanceData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No active quizzes to measure completion rates.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                <XAxis dataKey="quizName" className="text-xs font-semibold text-muted-foreground" />
                <YAxis className="text-xs font-semibold text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  name="Completion Rate (%)"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorRate)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
