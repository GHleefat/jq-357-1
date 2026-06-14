import type { AudioFeatures, EmotionType } from '@/types';

export interface EmotionResult {
  emotion: EmotionType;
  score: number;
  confidence: number;
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function analyzeEmotion(features: AudioFeatures): EmotionResult {
  const {
    pitchMean,
    pitchStd,
    energyMean,
    energyStd,
    speechRate,
    zeroCrossingRate,
  } = features;

  const normPitchMean = normalize(pitchMean, 80, 300);
  const normPitchStd = normalize(pitchStd, 5, 80);
  const normEnergy = normalize(energyMean, 0.005, 0.2);
  const normEnergyStd = normalize(energyStd, 0.005, 0.1);
  const normSpeechRate = normalize(speechRate, 0.5, 4);
  const normZcr = normalize(zeroCrossingRate, 0.02, 0.2);

  const scores: Record<EmotionType, number> = {
    happy: 0,
    calm: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
  };

  scores.happy = (
    normPitchMean * 0.25 +
    normPitchStd * 0.3 +
    normEnergy * 0.2 +
    normSpeechRate * 0.15 +
    (1 - normZcr) * 0.1
  );

  scores.calm = (
    (1 - normPitchMean) * 0.25 +
    (1 - normPitchStd) * 0.25 +
    (1 - normEnergy) * 0.25 +
    (1 - normSpeechRate) * 0.15 +
    (1 - normZcr) * 0.1
  );

  scores.sad = (
    (1 - normPitchMean) * 0.3 +
    normPitchStd * 0.1 +
    (1 - normEnergy) * 0.3 +
    (1 - normSpeechRate) * 0.2 +
    normZcr * 0.1
  );

  scores.angry = (
    normPitchMean * 0.15 +
    normPitchStd * 0.2 +
    normEnergy * 0.35 +
    normSpeechRate * 0.2 +
    normZcr * 0.1
  );

  scores.anxious = (
    normPitchMean * 0.2 +
    normPitchStd * 0.3 +
    normEnergy * 0.15 +
    normSpeechRate * 0.2 +
    normZcr * 0.15
  );

  let maxEmotion: EmotionType = 'calm';
  let maxScore = -Infinity;
  let totalScore = 0;

  for (const [emotion, score] of Object.entries(scores)) {
    totalScore += score;
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion as EmotionType;
    }
  }

  const confidence = totalScore > 0 ? maxScore / totalScore : 0.3;

  let emotionScore = 5;

  switch (maxEmotion) {
    case 'happy':
      emotionScore = 7 + Math.floor(scores.happy * 3);
      break;
    case 'calm':
      emotionScore = 5 + Math.floor((scores.calm - 0.5) * 4);
      break;
    case 'sad':
      emotionScore = 3 + Math.floor(scores.sad * 2);
      break;
    case 'angry':
      emotionScore = 2 + Math.floor(scores.angry * 2);
      break;
    case 'anxious':
      emotionScore = 4 + Math.floor(scores.anxious * 2);
      break;
  }

  emotionScore = Math.max(1, Math.min(10, emotionScore));

  return {
    emotion: maxEmotion,
    score: emotionScore,
    confidence: Math.min(0.95, Math.max(0.4, confidence)),
  };
}
