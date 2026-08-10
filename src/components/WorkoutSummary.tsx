import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Timer, Activity, TrendingUp } from 'lucide-react';
import { WorkoutSession } from '@/types/fitness';

interface WorkoutSummaryProps {
  sessions: WorkoutSession[];
}

export function WorkoutSummary({ sessions }: WorkoutSummaryProps) {
  const totalReps = sessions.reduce((sum, s) => sum + s.reps, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalCalories = sessions.reduce((sum, s) => sum + s.calories, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (sessions.length === 0) {
    return (
      <Card glass className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Workout Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Complete exercises to see your summary
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card glass className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Workout Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Totals */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalReps}</p>
            <p className="text-xs text-muted-foreground">Total Reps</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Timer className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{formatTime(totalDuration)}</p>
            <p className="text-xs text-muted-foreground">Total Time</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Flame className="w-5 h-5 text-energy mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalCalories}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-2">
          {sessions.map((session, index) => (
            <div 
              key={index}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <span className="font-medium">{session.exerciseName}</span>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{session.reps} reps</span>
                <span>{session.calories} kcal</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
