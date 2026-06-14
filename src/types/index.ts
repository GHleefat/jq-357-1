export type EmotionType = 'happy' | 'calm' | 'sad' | 'angry' | 'anxious';

export interface AudioFeatures {
  pitchMean: number;
  pitchStd: number;
  energyMean: number;
  energyStd: number;
  speechRate: number;
  zeroCrossingRate: number;
}

export interface DiaryEntry {
  id: string;
  audioBlobId: string;
  emotion: EmotionType;
  emotionScore: number;
  confidence: number;
  text: string;
  timestamp: number;
  duration: number;
  audioFeatures: AudioFeatures;
}

export interface EmotionConfig {
  type: EmotionType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  gradient: string;
}

export interface RecordingResult {
  blob: Blob;
  audioBuffer: AudioBuffer;
  duration: number;
}
