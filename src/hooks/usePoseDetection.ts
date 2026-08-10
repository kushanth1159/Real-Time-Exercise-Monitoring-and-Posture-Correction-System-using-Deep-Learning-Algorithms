import { useState, useRef, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose } from '@/types/fitness';

interface UsePoseDetectionReturn {
  isLoading: boolean;
  isModelReady: boolean;
  error: string | null;
  currentPose: Pose | null;
  startDetection: (videoElement: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export function usePoseDetection(): UsePoseDetectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);

  const initializeModel = useCallback(async () => {
    if (detectorRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prioritize WebGL backend for better performance on most devices
      // Fallback is handled automatically by tf.ready()
      try {
        await tf.setBackend('webgl');
      } catch (backendError) {
        console.warn('WebGL backend not supported, falling back to default', backendError);
      }
      
      await tf.ready();
      
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        enableSmoothing: true,
      };
      
      detectorRef.current = await poseDetection.createDetector(model, detectorConfig);
      setIsModelReady(true);
      setError(null);
    } catch (err) {
      console.error('Failed to load pose detection model:', err);
      // Don't set error immediately - model might still be loading
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectPose = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!detectorRef.current || !isDetectingRef.current) return;
    
    try {
      const poses = await detectorRef.current.estimatePoses(videoElement);
      
      if (poses.length > 0) {
        setCurrentPose({
          keypoints: poses[0].keypoints,
          score: poses[0].score
        });
      }
    } catch (err) {
      console.error('Pose detection error:', err);
    }
    
    if (isDetectingRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => detectPose(videoElement));
    }
  }, []);

  const startDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!detectorRef.current) {
      await initializeModel();
    }
    
    isDetectingRef.current = true;
    detectPose(videoElement);
  }, [initializeModel, detectPose]);

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCurrentPose(null);
  }, []);

  useEffect(() => {
    initializeModel();
    
    return () => {
      stopDetection();
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
    };
  }, [initializeModel, stopDetection]);

  return {
    isLoading,
    isModelReady,
    error,
    currentPose,
    startDetection,
    stopDetection
  };
}
