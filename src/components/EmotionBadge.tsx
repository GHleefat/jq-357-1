import { EMOTION_CONFIGS } from '@/config/emotions';
import type { EmotionType } from '@/types';

interface EmotionBadgeProps {
  emotion: EmotionType;
  score?: number;
  showLabel?: boolean;
  showEmoji?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmotionBadge({
  emotion,
  score,
  showLabel = true,
  showEmoji = true,
  size = 'md',
  className = '',
}: EmotionBadgeProps) {
  const config = EMOTION_CONFIGS[emotion];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {showEmoji && <span className={emojiSizes[size]}>{config.emoji}</span>}
      {showLabel && <span>{config.label}</span>}
      {score !== undefined && (
        <span className="opacity-70 font-mono">· {score}/10</span>
      )}
    </span>
  );
}
