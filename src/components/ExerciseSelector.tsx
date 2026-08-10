import { EXERCISES, ExerciseType } from '@/types/fitness';
import { cn } from '@/lib/utils';

interface ExerciseSelectorProps {
  selectedExercise: ExerciseType | null;
  onSelect: (exercise: ExerciseType) => void;
  disabled?: boolean;
}

export function ExerciseSelector({ selectedExercise, onSelect, disabled }: ExerciseSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {EXERCISES.map((exercise) => (
        <button
          key={exercise.id}
          onClick={() => onSelect(exercise.id)}
          disabled={disabled}
          className={cn(
            "relative p-4 rounded-xl border-2 transition-all duration-300 group",
            "hover:scale-105 hover:shadow-neon",
            selectedExercise === exercise.id
              ? "border-primary bg-primary/10 shadow-neon"
              : "border-border bg-card/50 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed hover:scale-100"
          )}
        >
          <div className="text-3xl mb-2">{exercise.icon}</div>
          <h3 className={cn(
            "font-semibold text-sm transition-colors",
            selectedExercise === exercise.id ? "text-primary" : "text-foreground"
          )}>
            {exercise.name}
          </h3>
          {exercise.isStatic && (
            <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
              HOLD
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
