import { useEffect, useRef } from 'react';
import { Pose, KEYPOINT_INDICES } from '@/types/fitness';

interface PoseCanvasProps {
  pose: Pose | null;
  videoWidth: number;
  videoHeight: number;
  isCorrectPosture: boolean;
}

const SKELETON_CONNECTIONS = [
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
] as const;

export function PoseCanvas({ pose, videoWidth, videoHeight, isCorrectPosture }: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!pose || !pose.keypoints) return;

    const keypoints = pose.keypoints;
    const color = isCorrectPosture ? '#22c55e' : '#ef4444';
    const glowColor = isCorrectPosture ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';

    // Draw skeleton connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;

    SKELETON_CONNECTIONS.forEach(([start, end]) => {
      const startIdx = KEYPOINT_INDICES[start as keyof typeof KEYPOINT_INDICES];
      const endIdx = KEYPOINT_INDICES[end as keyof typeof KEYPOINT_INDICES];
      
      const startPoint = keypoints[startIdx];
      const endPoint = keypoints[endIdx];

      if (startPoint?.score && startPoint.score > 0.3 && endPoint?.score && endPoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });

    // Draw keypoints
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Inner dot
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [pose, isCorrectPosture]);

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}
