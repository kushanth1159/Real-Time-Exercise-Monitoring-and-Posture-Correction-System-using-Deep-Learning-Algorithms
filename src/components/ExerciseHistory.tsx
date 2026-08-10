import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutSession, EXERCISES } from '@/types/fitness';
import { History, Calendar, Clock, Activity, Flame, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExerciseHistoryProps {
  sessions: WorkoutSession[];
  onClear: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, updates: Partial<WorkoutSession>) => void;
}

export function ExerciseHistory({ sessions, onClear, onDeleteSession, onUpdateSession }: ExerciseHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReps, setEditReps] = useState<number>(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startEditing = (session: WorkoutSession) => {
    setEditingId(session.id);
    setEditReps(session.reps);
  };

  const saveEdit = (id: string) => {
    onUpdateSession(id, { reps: editReps });
    setEditingId(null);
    toast.success('Session updated');
  };

  if (sessions.length === 0) {
    return (
      <Card glass className="border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Exercise History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No history yet. Start your first workout!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card glass className="border-border overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Exercise History
        </CardTitle>
        {confirmDeleteId === 'all' ? (
          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-8 px-2 text-[10px]" 
              onClick={() => {
                onClear();
                setConfirmDeleteId(null);
              }}
            >
              Confirm Clear
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setConfirmDeleteId(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setConfirmDeleteId('all')}
            className="h-8 px-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
          {sortedSessions.map((session) => {
            const exercise = EXERCISES.find(e => e.id === session.exerciseId);
            const isEditing = editingId === session.id;

            return (
              <div 
                key={session.id}
                className="p-4 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors group relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{exercise?.icon || '🎯'}</span>
                    <div>
                      <h4 className="font-semibold text-sm leading-none">{session.exerciseName}</h4>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(session.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button 
                          variant="glass" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => startEditing(session)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        
                        {confirmDeleteId === session.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="h-7 px-2 text-[10px]" 
                              onClick={() => {
                                onDeleteSession(session.id);
                                setConfirmDeleteId(null);
                              }}
                            >
                              Delete
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="glass" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                            onClick={() => setConfirmDeleteId(session.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    <span className="text-xs font-medium text-energy flex items-center gap-1 ml-2">
                      <Flame className="w-3 h-3" />
                      {session.calories} kcal
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-background/50 rounded-md p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none">Reps</p>
                        {isEditing ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Input 
                              type="number" 
                              value={editReps} 
                              onChange={(e) => setEditReps(parseInt(e.target.value) || 0)}
                              className="h-6 w-16 text-xs p-1"
                            />
                            <Button size="icon" className="h-6 w-6" onClick={() => saveEdit(session.id)}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs font-bold">{session.reps}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-md p-2 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-accent" />
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-none">Time</p>
                      <p className="text-xs font-bold">{formatTime(session.duration)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
