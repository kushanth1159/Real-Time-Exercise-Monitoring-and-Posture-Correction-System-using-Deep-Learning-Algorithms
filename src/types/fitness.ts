export type ExerciseType = 'bicep-curls' | 'arm-circles' | 'shoulder-press' | 'squats' | 'jumping-jacks';

export interface Exercise {
  id: ExerciseType;
  name: string;
  icon: string;
  metValue: number;
  isStatic: boolean;
  description: string;
}

export interface WorkoutStats {
  reps: number;
  duration: number; // in seconds
  calories: number;
  isCorrectPosture: boolean;
  feedback: string;
}

export interface UserProfile {
  name: string;
  avatar: string; // emoji or initials
  weight: number; // kg
  height: number; // cm
  age: number;
}

export interface WorkoutSession {
  id: string;
  exerciseId: ExerciseType;
  exerciseName: string;
  reps: number;
  duration: number;
  calories: number;
  timestamp: number;
}

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
}

export const EXERCISES: Exercise[] = [
  // Hand/Arm Exercises (3)
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    icon: '💪',
    metValue: 3.5,
    isStatic: false,
    description: 'Arm curling motion to strengthen biceps'
  },
  {
    id: 'arm-circles',
    name: 'Arm Circles',
    icon: '🔄',
    metValue: 3.0,
    isStatic: false,
    description: 'Circular arm movements for shoulder mobility'
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    icon: '🙌',
    metValue: 4.0,
    isStatic: false,
    description: 'Pressing arms overhead for shoulder strength'
  },
  // Full Body Exercises (2)
  {
    id: 'squats',
    name: 'Squats',
    icon: '🦵',
    metValue: 5.0,
    isStatic: false,
    description: 'Lower body powerhouse for quads, glutes, and core'
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    icon: '⭐',
    metValue: 8.0,
    isStatic: false,
    description: 'Full body cardio to get your heart pumping'
  }
];

// Keypoint indices for pose detection (MoveNet)
export const KEYPOINT_INDICES = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16
};
