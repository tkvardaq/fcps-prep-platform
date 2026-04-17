'use client'

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts'
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'

function EmptyChartState({ message }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-2xl z-10 text-center p-6">
      <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mb-3">
        <BarChart2 className="w-6 h-6" />
      </div>
      <p className="text-slate-400 text-sm font-medium max-w-[180px]">
        {message || 'Complete a test to see your analytics here'}
      </p>
    </div>
  )
}

export function AccuracyTrend({ data }) {
  // data: [{ name: 'Mon', accuracy: 65 }, ...]
  const isEmpty = !data || data.length === 0
  return (
    <div className="h-64 w-full relative">
      {isEmpty && <EmptyChartState message="Daily accuracy will appear here after your first quiz" />}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="accuracy" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopicMastery({ data }) {
  // data: [{ subject: 'Anatomy', score: 80 }, ...]
  const isEmpty = !data || data.length === 0
  return (
    <div className="h-64 w-full relative">
      {isEmpty && <EmptyChartState message="Perform a diagnostic to unlock subject mastery levels" />}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis 
            dataKey="subject" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
            width={100}
          />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
          <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.score < 60 ? '#ef4444' : (entry.score < 80 ? '#f59e0b' : '#10b981')} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RetentionMeter({ percentage }) {
  const isHealthy = percentage > 80
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="12"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            fill="transparent"
            stroke={isHealthy ? '#10b981' : '#f59e0b'}
            strokeWidth="12"
            strokeDasharray={364.4}
            initial={{ strokeDashoffset: 364.4 }}
            animate={{ strokeDashoffset: 364.4 - (364.4 * percentage) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-2xl font-black text-slate-900">{percentage}%</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 font-bold text-sm ${isHealthy ? 'text-teal-600' : 'text-amber-600'}`}>
        {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {isHealthy ? 'Retention Stable' : 'High Forget Risk'}
      </div>
    </div>
  )
}
