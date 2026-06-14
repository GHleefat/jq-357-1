import type { EmotionConfig, EmotionType } from '@/types';

export const EMOTION_CONFIGS: Record<EmotionType, EmotionConfig> = {
  happy: {
    type: 'happy',
    label: '开心',
    emoji: '😊',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    gradient: 'from-amber-400 to-orange-500',
  },
  calm: {
    type: 'calm',
    label: '平静',
    emoji: '😌',
    color: '#10B981',
    bgColor: '#D1FAE5',
    gradient: 'from-emerald-400 to-teal-500',
  },
  sad: {
    type: 'sad',
    label: '悲伤',
    emoji: '😢',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    gradient: 'from-blue-400 to-indigo-500',
  },
  angry: {
    type: 'angry',
    label: '愤怒',
    emoji: '😠',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    gradient: 'from-red-400 to-rose-500',
  },
  anxious: {
    type: 'anxious',
    label: '焦虑',
    emoji: '😰',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    gradient: 'from-violet-400 to-purple-500',
  },
};

export const EMOTION_LIST = Object.values(EMOTION_CONFIGS);
