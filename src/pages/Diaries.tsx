import { useEffect, useState } from 'react';
import { Trash2, Calendar, Clock, Filter, ArrowUpDown } from 'lucide-react';
import { EmotionBadge } from '@/components/EmotionBadge';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useDiaryStore } from '@/store/diaryStore';
import { EMOTION_CONFIGS, EMOTION_LIST } from '@/config/emotions';
import type { DiaryEntry, EmotionType } from '@/types';

export default function Diaries() {
  const { entries, fetchEntries, deleteEntry, getAudio } = useDiaryStore();
  const [audioBlobs, setAudioBlobs] = useState<Record<string, Blob>>({});
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | 'all'>('all');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const loadAudio = async () => {
      for (const entry of entries) {
        if (!audioBlobs[entry.id]) {
          const blob = await getAudio(entry.id);
          if (blob) {
            setAudioBlobs((prev) => ({ ...prev, [entry.id]: blob }));
          }
        }
      }
    };
    loadAudio();
  }, [entries, getAudio, audioBlobs]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
      }),
      weekday: date.toLocaleDateString('zh-CN', { weekday: 'long' }),
      time: date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      year: date.getFullYear(),
      monthDay: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    };
  };

  const filteredEntries = entries
    .filter((e) => selectedEmotion === 'all' || e.emotion === selectedEmotion)
    .sort((a, b) => (sortDesc ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));

  const groupedByDate = filteredEntries.reduce<Record<string, DiaryEntry[]>>((acc, entry) => {
    const key = new Date(entry.timestamp).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条日记吗？')) {
      await deleteEntry(id);
      setAudioBlobs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center">
          <span className="text-5xl">📝</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-stone-800">还没有日记</h3>
          <p className="text-stone-500">开始录制你的第一条语音日记吧</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-800" style={{ fontFamily: '"Lora", Georgia, serif' }}>
            我的日记
          </h2>
          <p className="text-stone-500 mt-1">共 {entries.length} 条记录</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-stone-400" />
          <span className="text-sm text-stone-500">情绪筛选：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedEmotion('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedEmotion === 'all'
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            全部
          </button>
          {EMOTION_LIST.map((config) => (
            <button
              key={config.type}
              onClick={() => setSelectedEmotion(config.type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedEmotion === config.type
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: selectedEmotion === config.type ? config.color : config.bgColor,
                color: selectedEmotion === config.type ? 'white' : config.color,
              }}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortDesc(!sortDesc)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all text-sm"
        >
          <ArrowUpDown size={14} />
          {sortDesc ? '最新优先' : '最早优先'}
        </button>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400">没有找到符合条件的日记</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateKey, dayEntries]) => {
            const firstEntry = dayEntries[0];
            const dateInfo = formatDate(firstEntry.timestamp);
            return (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2 text-stone-400">
                  <Calendar size={14} />
                  <span className="text-sm font-medium">{dateInfo.date}</span>
                  <span className="text-xs">{dateInfo.weekday}</span>
                </div>
                <div className="space-y-3">
                  {dayEntries.map((entry) => {
                    const entryDate = formatDate(entry.timestamp);
                    const config = EMOTION_CONFIGS[entry.emotion];
                    return (
                      <div
                        key={entry.id}
                        className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md"
                      >
                        <div className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <EmotionBadge emotion={entry.emotion} score={entry.emotionScore} />
                                <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                                  <Clock size={12} />
                                  <span>{entryDate.time}</span>
                                </div>
                                <div className="text-xs text-stone-400">
                                  时长 {entry.duration.toFixed(1)}秒
                                </div>
                              </div>
                              {entry.text && (
                                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                                  {entry.text}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="删除日记"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div
                            className="p-4 rounded-2xl"
                            style={{
                              backgroundColor: config.bgColor + '60',
                              borderLeft: `3px solid ${config.color}`,
                            }}
                          >
                            {audioBlobs[entry.id] ? (
                              <AudioPlayer blob={audioBlobs[entry.id]} />
                            ) : (
                              <div className="flex items-center gap-3 text-stone-400">
                                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center animate-pulse">
                                  <span className="text-sm">⏳</span>
                                </div>
                                <span className="text-sm">加载音频中...</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-stone-400">
                            <div className="flex items-center gap-1.5">
                              <span>置信度</span>
                              <div className="w-20 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${entry.confidence * 100}%`,
                                    backgroundColor: config.color,
                                  }}
                                />
                              </div>
                              <span className="font-mono">{Math.round(entry.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
