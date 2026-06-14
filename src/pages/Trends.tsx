import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Calendar, BarChart3, PieChart } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { useDiaryStore } from '@/store/diaryStore';
import { EMOTION_CONFIGS, EMOTION_LIST } from '@/config/emotions';
import type { EmotionType, DiaryEntry } from '@/types';

interface DailyData {
  date: string;
  dateKey: string;
  score: number;
  count: number;
  emotions: Record<EmotionType, number>;
}

interface MonthlyData {
  month: string;
  monthKey: string;
  avgScore: number;
  count: number;
  emotions: Record<EmotionType, number>;
}

export default function Trends() {
  const { entries, fetchEntries } = useDiaryStore();
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const emotionScoreMap: Record<EmotionType, number> = {
    happy: 10,
    calm: 7,
    anxious: 5,
    sad: 3,
    angry: 1,
  };

  const dailyData = useMemo(() => {
    const grouped = entries.reduce<Record<string, DailyData>>((acc, entry) => {
      const date = new Date(entry.timestamp);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const displayDate = `${date.getMonth() + 1}/${date.getDate()}`;

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: displayDate,
          dateKey,
          score: 0,
          count: 0,
          emotions: { happy: 0, calm: 0, sad: 0, angry: 0, anxious: 0 },
        };
      }

      acc[dateKey].score += entry.emotionScore;
      acc[dateKey].count += 1;
      acc[dateKey].emotions[entry.emotion] += 1;

      return acc;
    }, {});

    const sorted = Object.values(grouped)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((d) => ({
        ...d,
        score: Math.round((d.score / d.count) * 10) / 10,
      }));

    return sorted.slice(-30);
  }, [entries]);

  const monthlyData = useMemo(() => {
    const grouped = entries.reduce<Record<string, MonthlyData>>((acc, entry) => {
      const date = new Date(entry.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const displayMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: displayMonth,
          monthKey,
          avgScore: 0,
          count: 0,
          emotions: { happy: 0, calm: 0, sad: 0, angry: 0, anxious: 0 },
        };
      }

      acc[monthKey].avgScore += entry.emotionScore;
      acc[monthKey].count += 1;
      acc[monthKey].emotions[entry.emotion] += 1;

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((m) => ({
        ...m,
        avgScore: Math.round((m.avgScore / m.count) * 10) / 10,
      }));
  }, [entries]);

  const emotionDistribution = useMemo(() => {
    const counts: Record<EmotionType, number> = {
      happy: 0,
      calm: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
    };

    entries.forEach((e) => {
      counts[e.emotion] += 1;
    });

    return EMOTION_LIST.map((config) => ({
      name: config.label,
      value: counts[config.type],
      color: config.color,
      type: config.type,
    })).filter((d) => d.value > 0);
  }, [entries]);

  const weeklyAverage = useMemo(() => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + e.emotionScore, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  }, [entries]);

  const dominantEmotion = useMemo(() => {
    if (emotionDistribution.length === 0) return null;
    return emotionDistribution.reduce((a, b) => (a.value > b.value ? a : b));
  }, [emotionDistribution]);

  const chartData = viewMode === 'monthly' ? monthlyData : dailyData;
  const dataKey = viewMode === 'monthly' ? 'month' : 'date';
  const scoreKey = viewMode === 'monthly' ? 'avgScore' : 'score';

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center">
          <TrendingUp size={40} className="text-stone-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-stone-800">还没有数据</h3>
          <p className="text-stone-500">开始记录日记后，这里会显示你的情绪变化趋势</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-stone-200/60">
          <p className="font-semibold text-stone-800 mb-2">{label}</p>
          <p className="text-sm text-stone-600">
            心情指数：<span className="font-bold text-amber-600">{payload[0].value}/10</span>
          </p>
          <p className="text-sm text-stone-500">记录数：{data.count || 0} 条</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-800" style={{ fontFamily: '"Lora", Georgia, serif' }}>
            情绪趋势
          </h2>
          <p className="text-stone-500 mt-1">回顾你的心情变化</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="text-xl">😊</span>
            </div>
            <span className="text-stone-500 text-sm">平均心情</span>
          </div>
          <p className="text-4xl font-bold text-stone-800">
            {weeklyAverage}
            <span className="text-lg text-stone-400 font-normal">/10</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-violet-600" />
            </div>
            <span className="text-stone-500 text-sm">总记录</span>
          </div>
          <p className="text-4xl font-bold text-stone-800">{entries.length}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <PieChart size={20} className="text-rose-600" />
            </div>
            <span className="text-stone-500 text-sm">主导情绪</span>
          </div>
          {dominantEmotion && (
            <div className="flex items-center gap-2">
              <span className="text-3xl">{EMOTION_CONFIGS[dominantEmotion.type].emoji}</span>
              <p className="text-2xl font-bold" style={{ color: dominantEmotion.color }}>
                {dominantEmotion.name}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-800">情绪变化曲线</h3>
          </div>
          <div className="flex gap-2 bg-stone-100 rounded-full p-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              月度
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                viewMode === 'daily'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              近30天
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis
                dataKey={dataKey}
                stroke="#A8A29E"
                tick={{ fontSize: 12, fill: '#78716C' }}
                axisLine={{ stroke: '#E7E5E4' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#A8A29E"
                tick={{ fontSize: 12, fill: '#78716C' }}
                axisLine={{ stroke: '#E7E5E4' }}
                tickLine={false}
                tickFormatter={(value) => value === 0 ? '' : value}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={scoreKey}
                stroke="#F59E0B"
                strokeWidth={3}
                fill="url(#colorScore)"
                dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFF' }}
                activeDot={{ r: 6, stroke: '#FFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <PieChart size={20} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">情绪分布</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={emotionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {emotionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">情绪统计</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis
                  dataKey="name"
                  stroke="#A8A29E"
                  tick={{ fontSize: 12, fill: '#78716C' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#A8A29E"
                  tick={{ fontSize: 12, fill: '#78716C' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E7E5E4',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {emotionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
