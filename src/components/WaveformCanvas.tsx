import { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  isRecording: boolean;
  audioLevel: number;
  frequencyData?: Uint8Array | null;
  className?: string;
}

export function WaveformCanvas({
  isRecording,
  audioLevel,
  frequencyData,
  className = '',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const staticPhaseRef = useRef(0);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      if (isRecording && frequencyData && frequencyData.length > 0) {
        const barCount = 64;
        const barWidth = width / barCount - 2;
        const step = Math.floor(frequencyData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step;
          const value = frequencyData[dataIndex] || 0;
          const barHeight = (value / 255) * height * 0.85;
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
          gradient.addColorStop(0, '#F59E0B');
          gradient.addColorStop(0.5, '#EF4444');
          gradient.addColorStop(1, '#8B5CF6');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          const radius = Math.min(barWidth / 2, 4);
          ctx.roundRect(x, y, barWidth, barHeight, radius);
          ctx.fill();
        }
      } else {
        const barCount = 48;
        const barWidth = width / barCount - 2;
        const baseHeight = height * 0.15;

        if (barsRef.current.length !== barCount) {
          barsRef.current = new Array(barCount).fill(0).map(() => Math.random());
        }

        staticPhaseRef.current += 0.03;

        for (let i = 0; i < barCount; i++) {
          const phase = staticPhaseRef.current + i * 0.15;
          const base = barsRef.current[i];
          const wave = Math.sin(phase) * 0.5 + 0.5;
          const modulation = audioLevel > 0 ? audioLevel : wave * 0.4;
          const barHeight = baseHeight + modulation * height * 0.4 * base;
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
          gradient.addColorStop(0, '#94A3B8');
          gradient.addColorStop(1, '#CBD5E1');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          const radius = Math.min(barWidth / 2, 3);
          ctx.roundRect(x, y, barWidth, barHeight, radius);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel, frequencyData]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}
