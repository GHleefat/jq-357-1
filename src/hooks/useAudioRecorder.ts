import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingResult } from '@/types';

interface UseAudioRecorderOptions {
  onDataAvailable?: (data: Uint8Array) => void;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  audioLevel: number;
  isSupported: boolean;
  unsupportedReason: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordingResult | null>;
  error: string | null;
}

function checkEnvironmentSupport(): { supported: boolean; reason: string | null } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: '当前环境不是浏览器，无法使用录音功能' };
  }

  const isSecureContext = window.isSecureContext;
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

  if (!isSecureContext && !isLocalhost) {
    return {
      supported: false,
      reason:
        '当前页面运行在不安全的上下文中。请使用 HTTPS 协议访问，或在 localhost 本地环境中使用录音功能。',
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      reason:
        '当前浏览器不支持 navigator.mediaDevices API。请尝试使用最新版本的 Chrome、Edge、Safari 或 Firefox 浏览器。',
    };
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return {
      supported: false,
      reason: '当前浏览器不支持 Web Audio API，无法进行音频分析。请更新浏览器到最新版本。',
    };
  }

  if (typeof MediaRecorder === 'undefined') {
    return {
      supported: false,
      reason: '当前浏览器不支持 MediaRecorder API，无法录制音频。请使用 Chrome、Firefox 或 Edge 浏览器。',
    };
  }

  return { supported: true, reason: null };
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const result = checkEnvironmentSupport();
    setIsSupported(result.supported);
    setUnsupportedReason(result.reason);
    if (!result.supported) {
      setError(result.reason);
    }
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
    const avg = sum / dataArrayRef.current.length;
    const level = avg / 255;

    setAudioLevel(level);

    if (options.onDataAvailable) {
      options.onDataAvailable(dataArrayRef.current);
    }

    animationRef.current = requestAnimationFrame(updateAudioLevel);
  }, [options]);

  const startRecording = useCallback(async () => {
    setError(null);

    const envCheck = checkEnvironmentSupport();
    if (!envCheck.supported) {
      setError(envCheck.reason);
      setIsSupported(false);
      setUnsupportedReason(envCheck.reason);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        throw new Error('AudioContext 不可用');
      }

      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;

      startTimeRef.current = Date.now();
      setRecordingTime(0);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      updateAudioLevel();
    } catch (err) {
      let message = '无法访问麦克风，请检查权限设置';

      if (err instanceof Error) {
        const errName = err.name;
        const errMsg = err.message.toLowerCase();

        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          message = '麦克风权限已被拒绝。请在浏览器地址栏左侧的权限设置中允许访问麦克风。';
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          message = '未检测到可用的麦克风设备，请检查设备连接后重试。';
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          message = '麦克风被其他程序占用，请关闭其他使用麦克风的应用后重试。';
        } else if (errName === 'OverconstrainedError') {
          message = '当前设备不满足录音约束条件，请检查麦克风设置。';
        } else if (errName === 'SecurityError') {
          message = '安全限制：录音功能只能在 HTTPS 或 localhost 环境下使用。';
        } else if (errMsg.includes('permission') || errMsg.includes('denied')) {
          message = '麦克风权限已被拒绝。请在浏览器设置中允许访问麦克风。';
        } else {
          message = err.message;
        }
      }

      setError(message);
      setIsRecording(false);
    }
  }, [updateAudioLevel]);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !audioContextRef.current) {
        resolve(null);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;
      const audioContext = audioContextRef.current;

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const duration = (Date.now() - startTimeRef.current) / 1000;

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          resolve({
            blob,
            audioBuffer,
            duration,
          });
        } catch {
          resolve(null);
        }
      };

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      setAudioLevel(0);
      mediaRecorder.stop();
    });
  }, []);

  return {
    isRecording,
    recordingTime,
    audioLevel,
    isSupported,
    unsupportedReason,
    startRecording,
    stopRecording,
    error,
  };
}
