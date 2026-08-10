import { useState, useCallback, useEffect, useReducer } from 'react';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { WorkoutCamera } from '@/components/WorkoutCamera';
import { WorkoutSummary } from '@/components/WorkoutSummary';
import { ExerciseHistory } from '@/components/ExerciseHistory';
import { UserProfileModal } from '@/components/UserProfileModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ExerciseType, EXERCISES, UserProfile, WorkoutSession } from '@/types/fitness';
import { Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';

const defaultProfile: UserProfile = {
  name: 'Athlete',
  avatar: '💪',
  weight: 70,
  height: 175,
  age: 25
};

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

type SessionAction = 
  | { type: 'SET'; sessions: WorkoutSession[] }
  | { type: 'ADD'; session: WorkoutSession }
  | { type: 'DELETE'; id: string }
  | { type: 'UPDATE'; id: string; updates: Partial<WorkoutSession> }
  | { type: 'CLEAR' };

function sessionReducer(state: WorkoutSession[], action: SessionAction): WorkoutSession[] {
  console.log('Session Action:', action.type, action);
  switch (action.type) {
    case 'SET':
      return action.sessions;
    case 'ADD':
      return [action.session, ...state];
    case 'DELETE':
      return state.filter(s => s.id !== action.id);
    case 'UPDATE':
      return state.map(s => s.id === action.id ? { ...s, ...action.updates } : s);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export default function Index() {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => ({
    ...defaultProfile,
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Athlete'
  }));
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [sessions, dispatch] = useReducer(sessionReducer, [], () => {
    try {
      const saved = localStorage.getItem('workout_sessions');
      if (!saved) return [];
      const parsed = JSON.parse(saved) as WorkoutSession[];
      // Filter out invalid items and ensure IDs
      return parsed
        .filter(s => s && typeof s === 'object' && s.exerciseId)
        .map(s => s.id ? s : { ...s, id: generateId() });
    } catch (e) {
      console.error('Failed to load sessions:', e);
      return [];
    }
  });

  const [currentStats, setCurrentStats] = useState({ reps: 0, duration: 0, calories: 0 });

  // Persistence effect with error handling
  useEffect(() => {
    try {
      localStorage.setItem('workout_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Update name if user metadata changes
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setUserProfile(prev => ({ ...prev, name: user.user_metadata.full_name }));
    }
  }, [user]);

  const handleWorkoutUpdate = useCallback((reps: number, duration: number, calories: number) => {
    setCurrentStats({ reps, duration, calories });
  }, []);

  const handleExerciseSelect = useCallback((exercise: ExerciseType) => {
    if (selectedExercise && (currentStats.reps > 0 || currentStats.duration > 0)) {
      const exerciseData = EXERCISES.find(e => e.id === selectedExercise);
      if (exerciseData) {
        dispatch({
          type: 'ADD',
          session: {
            id: generateId(),
            exerciseId: selectedExercise,
            exerciseName: exerciseData.name,
            reps: currentStats.reps,
            duration: currentStats.duration,
            calories: currentStats.calories,
            timestamp: Date.now()
          }
        });
      }
    }
    setSelectedExercise(exercise);
    setCurrentStats({ reps: 0, duration: 0, calories: 0 });
  }, [selectedExercise, currentStats]);

  const handleDeleteSession = useCallback((id: string) => {
    if (!id) return;
    dispatch({ type: 'DELETE', id });
    toast.success('Workout removed');
  }, []);

  const handleUpdateSession = useCallback((id: string, updates: Partial<WorkoutSession>) => {
    if (!id) return;
    dispatch({ type: 'UPDATE', id, updates });
  }, []);

  const handleFinishWorkout = useCallback(() => {
    if (selectedExercise && (currentStats.reps > 0 || currentStats.duration > 0)) {
      const exerciseData = EXERCISES.find(e => e.id === selectedExercise);
      if (exerciseData) {
        dispatch({
          type: 'ADD',
          session: {
            id: generateId(),
            exerciseId: selectedExercise,
            exerciseName: exerciseData.name,
            reps: currentStats.reps,
            duration: currentStats.duration,
            calories: currentStats.calories,
            timestamp: Date.now()
          }
        });
        setCurrentStats({ reps: 0, duration: 0, calories: 0 });
      }
    }
  }, [selectedExercise, currentStats]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    toast.success('History cleared');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">FitAI Coach</h1>
              <p className="text-sm text-muted-foreground">Real-time workout analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="icon"
              onClick={() => setShowProfileModal(true)}
              className="hover:text-primary transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exercise Selector */}
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Select Exercise
              </h2>
              <ExerciseSelector
                selectedExercise={selectedExercise}
                onSelect={handleExerciseSelect}
              />
            </section>

            {/* Camera View */}
            <section>
              <WorkoutCamera
                selectedExercise={selectedExercise}
                userProfile={userProfile}
                onWorkoutUpdate={handleWorkoutUpdate}
                onFinishWorkout={handleFinishWorkout}
              />
            </section>

            {/* Exercise Description */}
            {selectedExercise && (
              <div className="glass rounded-xl p-4 animate-slide-in">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">
                    {EXERCISES.find(e => e.id === selectedExercise)?.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {EXERCISES.find(e => e.id === selectedExercise)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {EXERCISES.find(e => e.id === selectedExercise)?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WorkoutSummary sessions={sessions} />
            <ExerciseHistory 
              sessions={sessions} 
              onClear={clearHistory}
              onDeleteSession={handleDeleteSession}
              onUpdateSession={handleUpdateSession}
            />
            
            {/* Quick Stats */}
            <div className="glass rounded-xl p-6 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl border-2 border-primary/50">
                  {userProfile.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{userProfile.name}</h3>
                  <p className="text-xs text-muted-foreground">Fitness Enthusiast</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-semibold">{userProfile.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-semibold">{userProfile.height} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-semibold">{userProfile.age} years</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowProfileModal(true)}
              >
                Update Profile
              </Button>
            </div>

            {/* Tips Card */}
            <div className="glass rounded-xl p-6 border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Position your camera to show your full body
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Ensure good lighting for accurate tracking
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Follow the posture feedback for best results
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <UserProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={setUserProfile}
        initialProfile={userProfile}
      />
    </div>
  );
}
