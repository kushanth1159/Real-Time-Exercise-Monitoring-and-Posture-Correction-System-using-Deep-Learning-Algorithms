import { cn } from '@/lib/utils';
import { Exercise } from '@/types/fitness';
import { Flame, Timer, Activity, CheckCircle, XCircle, Info } from 'lucide-react';

interface StatsOverlayProps {
  exercise: Exercise | null;
  reps: number;
  duration: number;
  calories: number;
  isCorrectPosture: boolean;
  feedback: string;
}

const EXERCISE_INSTRUCTIONS: Record<string, { steps: string[]; tips: string }> = {
  'bicep-curls': {
    steps: [
      '1. Stand straight, arms at sides',
      '2. Bend elbows, bring hands to shoulders',
      '3. Lower arms back down slowly'
    ],
    tips: 'Keep elbows close to your body'
  },
  'arm-circles': {
    steps: [
      '1. Extend arms out to sides',
      '2. Make circular motions forward',
      '3. Keep arms at shoulder height'
    ],
    tips: 'Start with small circles, gradually increase'
  },
  'shoulder-press': {
    steps: [
      '1. Raise hands to shoulder level',
      '2. Press arms straight up overhead',
      '3. Lower back to shoulder level'
    ],
    tips: 'Keep core tight, don\'t arch back'
  },
  'squats': {
    steps: [
      '1. Stand with feet shoulder-width apart',
      '2. Bend knees, lower hips back',
      '3. Go down until thighs are parallel',
      '4. Push through heels to stand up'
    ],
    tips: 'Keep knees over toes, chest up'
  },
  'jumping-jacks': {
    steps: [
      '1. Start with feet together, arms down',
      '2. Jump, spread legs and raise arms',
      '3. Jump back to starting position'
    ],
    tips: 'Land softly on balls of feet'
  }
};

export function StatsOverlay({ 
  exercise, 
  reps, 
  duration, 
  calories, 
  isCorrectPosture, 
  feedback 
}: StatsOverlayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const instructions = exercise ? EXERCISE_INSTRUCTIONS[exercise.id] : null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Stats Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Exercise Name */}
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{exercise?.icon || '🎯'}</span>
            <div>
              <h3 className="font-bold text-foreground">{exercise?.name || 'Select Exercise'}</h3>
              <p className="text-xs text-muted-foreground">
                {exercise?.isStatic ? 'Hold for time' : 'Count reps'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex gap-2">
          {/* Reps/Duration */}
          <div className="glass rounded-xl px-4 py-3 min-w-[100px] text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              {exercise?.isStatic ? <Timer className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
              <span className="text-xs">{exercise?.isStatic ? 'TIME' : 'REPS'}</span>
            </div>
            <p className="text-3xl font-bold text-primary neon-text">
              {exercise?.isStatic ? formatTime(duration) : reps}
            </p>
          </div>

          {/* Time Elapsed */}
          <div className="glass rounded-xl px-4 py-3 min-w-[100px] text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Timer className="w-4 h-4" />
              <span className="text-xs">TIME</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatTime(duration)}
            </p>
          </div>

          {/* Calories */}
          <div className="glass rounded-xl px-4 py-3 min-w-[100px] text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Flame className="w-4 h-4 text-energy" />
              <span className="text-xs">KCAL</span>
            </div>
            <p className="text-3xl font-bold text-energy">
              {calories}
            </p>
          </div>
        </div>
      </div>

      {/* Exercise Instructions - Left Side */}
      {instructions && (
        <div className="absolute left-4 top-24 max-w-[200px]">
          <div className="glass rounded-xl px-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">How to do it</span>
            </div>
            <div className="space-y-1">
              {instructions.steps.map((step, index) => (
                <p key={index} className="text-xs text-muted-foreground leading-relaxed">
                  {step}
                </p>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-primary font-medium">💡 {instructions.tips}</p>
            </div>
          </div>
        </div>
      )}

      {/* Posture Feedback */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className={cn(
          "glass rounded-xl px-4 py-3 transition-all duration-300",
          isCorrectPosture 
            ? "border-primary/50 shadow-neon" 
            : "border-destructive/50 shadow-[0_0_20px_hsl(var(--destructive)/0.4)]"
        )}>
          <div className="flex items-center gap-3">
            {isCorrectPosture ? (
              <CheckCircle className="w-6 h-6 text-primary shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive shrink-0" />
            )}
            <div>
              <p className={cn(
                "font-semibold",
                isCorrectPosture ? "text-primary" : "text-destructive"
              )}>
                {isCorrectPosture ? 'Correct Position' : 'Adjust Posture'}
              </p>
              <p className="text-sm text-muted-foreground">{feedback}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
