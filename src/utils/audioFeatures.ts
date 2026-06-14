import type { AudioFeatures } from '@/types';

export function extractEnergy(channelData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < channelData.length; i++) {
    sum += channelData[i] * channelData[i];
  }
  return Math.sqrt(sum / channelData.length);
}

export function extractEnergyStd(channelData: Float32Array, mean: number): number {
  let sum = 0;
  for (let i = 0; i < channelData.length; i++) {
    const diff = channelData[i] * channelData[i] - mean * mean;
    sum += diff * diff;
  }
  return Math.sqrt(sum / channelData.length);
}

export function extractZeroCrossingRate(channelData: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < channelData.length; i++) {
    if (channelData[i - 1] >= 0 && channelData[i] < 0) {
      crossings++;
    } else if (channelData[i - 1] < 0 && channelData[i] >= 0) {
      crossings++;
    }
  }
  return crossings / channelData.length;
}

export function extractPitch(
  channelData: Float32Array,
  sampleRate: number
): number {
  const SIZE = channelData.length;
  const rms = Math.sqrt(
    channelData.reduce((acc, val) => acc + val * val, 0) / SIZE
  );

  if (rms < 0.01) return 0;

  const r1 = 0;
  const r2 = SIZE - 1;
  const threshold = 0.2;

  let rms1 = 0;
  for (let i = r1; i < r2; i++) {
    rms1 += channelData[i] * channelData[i];
  }
  rms1 = Math.sqrt(rms1 / (r2 - r1));

  if (rms1 < threshold) return 0;

  let c1 = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c1[i] = c1[i] + channelData[j] * channelData[j + i];
    }
  }

  let d0 = 0;
  while (c1[0] > c1[d0 + 1]) {
    d0 = d0 + 1;
  }

  let dmax = 0;
  for (let i = d0; i < SIZE; i++) {
    if (c1[i] >= c1[dmax]) {
      dmax = i;
    }
  }

  const T0 = dmax;
  if (T0 === 0) return 0;

  const x1 = c1[T0 - 1];
  const x2 = c1[T0];
  const x3 = c1[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  let betterT0 = T0 - b / (2 * a);
  return sampleRate / betterT0;
}

export function estimateSpeechRate(
  channelData: Float32Array,
  sampleRate: number,
  duration: number
): number {
  const frameSize = Math.floor(sampleRate * 0.02);
  let voicedFrames = 0;
  const totalFrames = Math.floor(channelData.length / frameSize);

  for (let i = 0; i < totalFrames; i++) {
    const start = i * frameSize;
    const frame = channelData.slice(start, start + frameSize);
    const energy = extractEnergy(frame);
    if (energy > 0.01) {
      voicedFrames++;
    }
  }

  if (duration <= 0) return 0;
  return voicedFrames / duration;
}

export function extractAllFeatures(
  audioBuffer: AudioBuffer
): AudioFeatures {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  const pitchValues: number[] = [];
  const energyValues: number[] = [];
  const zcrValues: number[] = [];

  const frameSize = Math.floor(sampleRate * 0.05);
  const hopSize = Math.floor(sampleRate * 0.025);

  for (let i = 0; i + frameSize < channelData.length; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize);
    const pitch = extractPitch(frame, sampleRate);
    if (pitch > 50 && pitch < 500) {
      pitchValues.push(pitch);
    }
    energyValues.push(extractEnergy(frame));
    zcrValues.push(extractZeroCrossingRate(frame));
  }

  const pitchMean = pitchValues.length > 0
    ? pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length
    : 150;

  const pitchStd = pitchValues.length > 1
    ? Math.sqrt(
      pitchValues.reduce((acc, val) => {
        const diff = val - pitchMean;
        return acc + diff * diff;
      }, 0) / (pitchValues.length - 1)
    )
    : 20;

  const energyMean = energyValues.length > 0
    ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length
    : 0.05;

  const energyStd = energyValues.length > 1
    ? Math.sqrt(
      energyValues.reduce((acc, val) => {
        const diff = val - energyMean;
        return acc + diff * diff;
      }, 0) / (energyValues.length - 1)
    )
    : 0.02;

  const zeroCrossingRate = zcrValues.length > 0
    ? zcrValues.reduce((a, b) => a + b, 0) / zcrValues.length
    : 0.05;

  const speechRate = estimateSpeechRate(channelData, sampleRate, duration);

  return {
    pitchMean,
    pitchStd,
    energyMean,
    energyStd,
    speechRate,
    zeroCrossingRate,
  };
}
