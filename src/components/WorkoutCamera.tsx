import { useEffect, useState, useCallback, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { PoseCanvas } from './PoseCanvas';
import { StatsOverlay } from './StatsOverlay';
import { Button } from '@/components/ui/button';
import { ExerciseType, EXERCISES, UserProfile } from '@/types/fitness';
import { analyzeExercise, calculateCalories } from '@/utils/poseAnalysis';
import { Camera, CameraOff, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkoutCameraProps {
  selectedExercise: ExerciseType | null;
  userProfile: UserProfile;
  onWorkoutUpdate: (reps: number, duration: number, calories: number) => void;
  onFinishWorkout: () => void;
}

export function WorkoutCamera({ selectedExercise, userProfile, onWorkoutUpdate, onFinishWorkout }: WorkoutCameraProps) {
  const { isStreaming, error: cameraError, videoRef, startCamera, stopCamera } = useCamera();
  const { isLoading, isModelReady, error: modelError, currentPose, startDetection, stopDetection } = usePoseDetection();
  
  const [reps, setReps] = useState(0);
  const [duration, setDuration] = useState(0);
  const [calories, setCalories] = useState(0);
  const [isCorrectPosture, setIsCorrectPosture] = useState(true);
  const [feedback, setFeedback] = useState('Get ready!');
  
  const exerciseStateRef = useRef<{ phase: 'up' | 'down' | 'neutral'; repCounted: boolean }>({ phase: 'neutral', repCounted: false });
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRepCountRef = useRef(0);

  const exercise = selectedExercise ? EXERCISES.find(e => e.id === selectedExercise) : null;

  const resetLocalStats = useCallback(() => {
    setReps(0);
    setDuration(0);
    setCalories(0);
    setFeedback('Get ready!');
    exerciseStateRef.current = { phase: 'neutral' as const, repCounted: false };
    lastRepCountRef.current = 0;
  }, []);

  // Reset stats when exercise changes
  useEffect(() => {
    resetLocalStats();
  }, [selectedExercise, resetLocalStats]);

  const handleFinish = () => {
    if (reps > 0 || duration > 0) {
      onFinishWorkout();
      resetLocalStats();
      toast.success('Workout finished and saved!');
    } else {
      toast.error('No exercise recorded yet');
    }
  };

  // Handle camera start
  const handleStartCamera = useCallback(async () => {
    await startCamera();
  }, [startCamera]);

  // Start pose detection when camera is streaming
  useEffect(() => {
    if (isStreaming && videoRef.current && isModelReady) {
      startDetection(videoRef.current);
    }
    return () => {
      stopDetection();
    };
  }, [isStreaming, isModelReady, startDetection, stopDetection, videoRef]);

  // Duration timer - always runs when streaming
  useEffect(() => {
    if (isStreaming && selectedExercise) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isStreaming, selectedExercise]);

  // Analyze pose
  useEffect(() => {
    if (!currentPose || !selectedExercise) return;

    const result = analyzeExercise(selectedExercise, currentPose.keypoints, exerciseStateRef.current);
    
    setIsCorrectPosture(result.isCorrectPosture);
    setFeedback(result.feedback);
    exerciseStateRef.current = result.newState;
    
    if (result.shouldCountRep) {
      setReps(prev => prev + 1);
    }
  }, [currentPose, selectedExercise]);

  // Calculate calories
  useEffect(() => {
    if (!exercise) return;

    const durationMinutes = exercise.isStatic 
      ? duration / 60 
      : (reps * 3) / 60; // Estimate ~3 seconds per rep
    
    const newCalories = calculateCalories(exercise.metValue, userProfile.weight, durationMinutes);
    setCalories(newCalories);
    
    onWorkoutUpdate(reps, duration, newCalories);
  }, [reps, duration, exercise, userProfile.weight, onWorkoutUpdate]);

  // Animate rep count
  useEffect(() => {
    if (reps > lastRepCountRef.current) {
      lastRepCountRef.current = reps;
    }
  }, [reps]);

  const handleStopCamera = () => {
    stopCamera();
    stopDetection();
  };

  return (
    <div className="relative w-full aspect-video bg-card rounded-2xl overflow-hidden border border-border">
      {/* Video Feed */}
      <video
        ref={videoRef}
        className={cn(
          "w-full h-full object-cover",
          isStreaming ? "opacity-100" : "opacity-0"
        )}
        style={{ transform: 'scaleX(-1)' }}
        playsInline
        muted
      />

      {/* Pose Overlay */}
      {isStreaming && currentPose && videoRef.current && (
        <PoseCanvas
          pose={currentPose}
          videoWidth={videoRef.current.videoWidth}
          videoHeight={videoRef.current.videoHeight}
          isCorrectPosture={isCorrectPosture}
        />
      )}

      {/* Stats Overlay */}
      {isStreaming && selectedExercise && (
        <StatsOverlay
          exercise={exercise || null}
          reps={reps}
          duration={duration}
          calories={calories}
          isCorrectPosture={isCorrectPosture}
          feedback={feedback}
        />
      )}

      {/* Camera Controls */}
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background/50 to-background">
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 pulse-glow">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Start Your Workout</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {selectedExercise 
                ? 'Camera access is needed to track your movements'
                : 'Select an exercise above, then start your camera'}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading AI model...</span>
            </div>
          )}

          {cameraError && (
            <p className="text-destructive text-sm text-center max-w-xs">
              {cameraError}
            </p>
          )}

          <Button
            onClick={handleStartCamera}
            disabled={!selectedExercise || isLoading}
            size="lg"
            className="gap-2"
          >
            <Camera className="w-5 h-5" />
            Start Camera
          </Button>
        </div>
      )}

      {/* Control Buttons */}
      {isStreaming && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            onClick={handleFinish}
            variant="glass"
            className="gap-2 border-primary/50 text-primary hover:bg-primary/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Finish & Save
          </Button>
          <Button
            onClick={handleStopCamera}
            variant="destructive"
            size="icon"
          >
            <CameraOff className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Model Loading Indicator */}
      {isStreaming && !isModelReady && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass rounded-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Initializing pose detection...</span>
          </div>
        </div>
      )}
    </div>
  );
}
