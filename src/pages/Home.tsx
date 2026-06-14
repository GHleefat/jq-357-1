import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Square,
  RotateCcw,
  Save,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { WaveformCanvas } from "@/components/WaveformCanvas";
import { EmotionBadge } from "@/components/EmotionBadge";
import { EMOTION_CONFIGS } from "@/config/emotions";
import { extractAllFeatures } from "@/utils/audioFeatures";
import { analyzeEmotion } from "@/utils/emotionAnalysis";
import { useDiaryStore } from "@/store/diaryStore";
import type { EmotionResult } from "@/utils/emotionAnalysis";
import type { RecordingResult, DiaryEntry } from "@/types";

export default function Home() {
  const navigate = useNavigate();
  const createEntry = useDiaryStore((s) => s.createEntry);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [recordingResult, setRecordingResult] =
    useState<RecordingResult | null>(null);
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diaryText, setDiaryText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleDataAvailable = useCallback((data: Uint8Array) => {
    setFrequencyData(new Uint8Array(data));
  }, []);

  const {
    isRecording,
    recordingTime,
    audioLevel,
    isSupported,
    unsupportedReason,
    startRecording,
    stopRecording,
    error,
  } = useAudioRecorder({ onDataAvailable: handleDataAvailable });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStop = async () => {
    setIsAnalyzing(true);
    const result = await stopRecording();
    if (result) {
      setRecordingResult(result);
      try {
        const features = extractAllFeatures(result.audioBuffer);
        const emotion = analyzeEmotion(features);
        setEmotionResult(emotion);
        setDiaryText(`今天的心情${EMOTION_CONFIGS[emotion.emotion].label}...`);
      } catch (e) {
        console.error("分析失败:", e);
      }
    }
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setRecordingResult(null);
    setEmotionResult(null);
    setDiaryText("");
    setFrequencyData(null);
  };

  const handleSave = async () => {
    if (!recordingResult || !emotionResult) return;
    setIsSaving(true);
    try {
      const features = extractAllFeatures(recordingResult.audioBuffer);
      const entry: Omit<DiaryEntry, "id" | "audioBlobId" | "timestamp"> = {
        emotion: emotionResult.emotion,
        emotionScore: emotionResult.score,
        confidence: emotionResult.confidence,
        text: diaryText,
        duration: recordingResult.duration,
        audioFeatures: features,
      };
      await createEntry(entry, recordingResult.blob);
      navigate("/diaries");
    } catch (e) {
      console.error("保存失败:", e);
    }
    setIsSaving(false);
  };

  useEffect(() => {
    return () => {
      if (recordingResult?.blob) {
        // Cleanup in production
      }
    };
  }, [recordingResult]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <h2
          className="text-3xl font-bold text-stone-800"
          style={{ fontFamily: '"Lora", Georgia, serif' }}
        >
          记录今天的心情
        </h2>
        <p className="text-stone-500">点击下方按钮，说出今天发生的事</p>
      </div>

      <div className="relative w-full h-40 bg-white/60 rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden p-4">
        <WaveformCanvas
          isRecording={isRecording && isSupported}
          audioLevel={audioLevel}
          frequencyData={frequencyData}
        />
        {!isRecording && !recordingResult && isSupported && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-stone-400 text-sm">准备就绪，等待开始录音...</p>
          </div>
        )}
        {!isSupported && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
            <div className="text-center">
              <p className="text-stone-500 text-sm font-medium">
                当前环境不支持录音
              </p>
              <p className="text-stone-400 text-xs mt-1">
                请在支持的浏览器和 HTTPS 环境下使用
              </p>
            </div>
          </div>
        )}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono text-stone-600">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        {isRecording && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-red-400/30 animate-ping"
              style={{ transform: `scale(${1 + audioLevel * 0.5})` }}
            />
            <div
              className="absolute inset-0 rounded-full bg-red-400/20 blur-xl"
              style={{ transform: `scale(${1.3 + audioLevel * 0.3})` }}
            />
          </>
        )}
        <button
          onClick={isRecording ? handleStop : startRecording}
          disabled={isAnalyzing || !isSupported}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isRecording
              ? "bg-gradient-to-br from-red-500 to-rose-600 text-white hover:scale-105"
              : isSupported
                ? "bg-gradient-to-br from-amber-400 via-rose-400 to-violet-500 text-white hover:scale-105 hover:shadow-2xl"
                : "bg-stone-300 text-stone-500 cursor-not-allowed"
          } ${isAnalyzing ? "opacity-60 cursor-wait" : ""}`}
          title={
            !isSupported ? unsupportedReason || "当前环境不支持录音" : undefined
          }
        >
          {isAnalyzing ? (
            <Sparkles className="w-10 h-10 animate-spin" />
          ) : isRecording ? (
            <Square className="w-10 h-10 fill-current" />
          ) : isSupported ? (
            <Mic className="w-12 h-12" strokeWidth={2} />
          ) : (
            <AlertTriangle className="w-10 h-10" />
          )}
        </button>
      </div>

      {!isSupported && unsupportedReason && (
        <div className="w-full p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={22}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <p className="font-semibold text-amber-800">
                当前环境不支持录音功能
              </p>
              <p className="text-sm text-amber-700 leading-relaxed">
                {unsupportedReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {isSupported && error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {isAnalyzing && !emotionResult && (
        <div className="text-center text-stone-500">
          <p className="animate-pulse">正在分析语音情绪...</p>
        </div>
      )}

      {emotionResult && recordingResult && (
        <div className="w-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div
            className="p-6 rounded-3xl border shadow-sm"
            style={{
              backgroundColor: EMOTION_CONFIGS[emotionResult.emotion].bgColor,
              borderColor: EMOTION_CONFIGS[emotionResult.emotion].color + "40",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">
                  {EMOTION_CONFIGS[emotionResult.emotion].emoji}
                </span>
                <div>
                  <p
                    className="text-sm opacity-70"
                    style={{
                      color: EMOTION_CONFIGS[emotionResult.emotion].color,
                    }}
                  >
                    检测到情绪
                  </p>
                  <h3
                    className="text-2xl font-bold"
                    style={{
                      color: EMOTION_CONFIGS[emotionResult.emotion].color,
                      fontFamily: '"Lora", Georgia, serif',
                    }}
                  >
                    {EMOTION_CONFIGS[emotionResult.emotion].label}
                  </h3>
                </div>
              </div>
              <EmotionBadge
                emotion={emotionResult.emotion}
                score={emotionResult.score}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span
                  style={{
                    color: EMOTION_CONFIGS[emotionResult.emotion].color,
                  }}
                >
                  置信度
                </span>
                <span
                  className="font-mono"
                  style={{
                    color: EMOTION_CONFIGS[emotionResult.emotion].color,
                  }}
                >
                  {Math.round(emotionResult.confidence * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${emotionResult.confidence * 100}%`,
                    backgroundColor:
                      EMOTION_CONFIGS[emotionResult.emotion].color,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-stone-800">日记内容</h4>
              <span className="text-xs text-stone-400">可编辑</span>
            </div>
            <textarea
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              className="w-full h-28 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-stone-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
              placeholder="记录一下此刻的感受..."
            />
            <p className="text-xs text-stone-400">
              录音时长：{recordingResult.duration.toFixed(1)} 秒
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="flex-1 py-4 px-6 rounded-2xl bg-stone-100 text-stone-600 font-medium flex items-center justify-center gap-2 hover:bg-stone-200 transition-all active:scale-[0.98]"
            >
              <RotateCcw size={18} />
              重新录制
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 text-white font-medium flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <Save size={18} />
              {isSaving ? "保存中..." : "保存日记"}
            </button>
          </div>
        </div>
      )}

      {!recordingResult && !isRecording && (
        <div className="w-full grid grid-cols-3 gap-3 text-center">
          {Object.values(EMOTION_CONFIGS).map((config) => (
            <div
              key={config.type}
              className="p-4 rounded-2xl border border-stone-200/60 bg-white/60"
            >
              <span className="text-2xl">{config.emoji}</span>
              <p className="text-xs mt-1 text-stone-600">{config.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
