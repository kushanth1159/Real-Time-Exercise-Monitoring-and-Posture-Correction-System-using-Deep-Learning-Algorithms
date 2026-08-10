import { Keypoint, KEYPOINT_INDICES, ExerciseType } from '@/types/fitness';

// Calculate angle between three points (with higher precision)
export function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Calculate distance between two points
export function calculateDistance(a: Keypoint, b: Keypoint): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

// Get keypoint by name with confidence threshold for accuracy
export function getKeypoint(keypoints: Keypoint[], name: keyof typeof KEYPOINT_INDICES): Keypoint | null {
  const index = KEYPOINT_INDICES[name];
  const keypoint = keypoints[index];
  // Higher confidence threshold (0.35) for better detection while maintaining accuracy
  if (keypoint && keypoint.score && keypoint.score > 0.35) {
    return keypoint;
  }
  return null;
}

// Smooth keypoint data to reduce jitter - added distance-based damping for accuracy
const keypointHistory: Map<string, Keypoint[]> = new Map();
const SMOOTHING_FRAMES = 10; // Increased for even better stability

export function smoothKeypoint(keypoint: Keypoint, name: string): Keypoint {
  const history = keypointHistory.get(name) || [];
  
  // Velocity-aware filtering: If point jumps too far too fast, it's likely noise
  if (history.length > 0) {
    const last = history[history.length - 1];
    const dist = calculateDistance(last, keypoint);
    // If distance is huge (>200px in one frame), treat it as highly suspect by reducing its score
    if (dist > 200) {
      keypoint.score = (keypoint.score || 0) * 0.1;
    }
  }

  history.push(keypoint);
  if (history.length > SMOOTHING_FRAMES) {
    history.shift();
  }
  keypointHistory.set(name, history);
  
  // Weighted moving average with confidence weighting
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let weightedScore = 0;
  
  history.forEach((kp, index) => {
    // Combine temporal weight (index) and confidence weight (kp.score)
    const weight = Math.pow(1.6, index) * (kp.score || 0.1);
    totalWeight += weight;
    weightedX += kp.x * weight;
    weightedY += kp.y * weight;
    weightedScore += (kp.score || 0) * weight;
  });
  
  if (totalWeight === 0) return keypoint;

  return { 
    x: weightedX / totalWeight, 
    y: weightedY / totalWeight, 
    score: weightedScore / totalWeight, 
    name: keypoint.name 
  };
}

interface ExerciseState {
  phase: 'up' | 'down' | 'neutral';
  repCounted: boolean;
  lastAngle?: number;
  bufferCount?: number; // To handle transient noise
}

interface AnalysisResult {
  isCorrectPosture: boolean;
  feedback: string;
  shouldCountRep: boolean;
  newState: ExerciseState;
}

// Helper to get torso length for scaling normalization
function getTorsoLength(keypoints: Keypoint[]): number {
  const lShoulder = getKeypoint(keypoints, 'leftShoulder');
  const rShoulder = getKeypoint(keypoints, 'rightShoulder');
  const lHip = getKeypoint(keypoints, 'leftHip');
  const rHip = getKeypoint(keypoints, 'rightHip');

  const shoulder = (lShoulder && rShoulder) 
    ? { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 }
    : lShoulder || rShoulder;
    
  const hip = (lHip && rHip)
    ? { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
    : lHip || rHip;

  if (shoulder && hip) {
    return calculateDistance(shoulder as Keypoint, hip as Keypoint);
  }
  return 100; // Default fallback
}

// Analyze Bicep Curls (Improved Accuracy)
export function analyzeBicepCurls(keypoints: Keypoint[], state: ExerciseState): AnalysisResult {
  let leftShoulder = getKeypoint(keypoints, 'leftShoulder');
  let leftElbow = getKeypoint(keypoints, 'leftElbow');
  let leftWrist = getKeypoint(keypoints, 'leftWrist');
  let rightShoulder = getKeypoint(keypoints, 'rightShoulder');
  let rightElbow = getKeypoint(keypoints, 'rightElbow');
  let rightWrist = getKeypoint(keypoints, 'rightWrist');

  if (leftShoulder) leftShoulder = smoothKeypoint(leftShoulder, 'leftShoulder');
  if (leftElbow) leftElbow = smoothKeypoint(leftElbow, 'leftElbow');
  if (leftWrist) leftWrist = smoothKeypoint(leftWrist, 'leftWrist');
  if (rightShoulder) rightShoulder = smoothKeypoint(rightShoulder, 'rightShoulder');
  if (rightElbow) rightElbow = smoothKeypoint(rightElbow, 'rightElbow');
  if (rightWrist) rightWrist = smoothKeypoint(rightWrist, 'rightWrist');

  const hasLeftArm = leftShoulder && leftElbow && leftWrist;
  const hasRightArm = rightShoulder && rightElbow && rightWrist;

  if (!hasLeftArm && !hasRightArm) {
    return { isCorrectPosture: false, feedback: 'Arms should be clearly visible', shouldCountRep: false, newState: state };
  }

  const leftArmAngle = hasLeftArm ? calculateAngle(leftShoulder!, leftElbow!, leftWrist!) : 180;
  const rightArmAngle = hasRightArm ? calculateAngle(rightShoulder!, rightElbow!, rightWrist!) : 180;
  const armAngle = Math.min(leftArmAngle, rightArmAngle);

  let isCorrectPosture = true;
  let feedback = 'Keep it up!';

  // Hysteresis based state machine
  const newState = { ...state };
  let shouldCountRep = false;

  // Rep detection thresholds with hysteresis
  const THRESHOLD_DOWN = 160;
  const THRESHOLD_UP = 40;

  if (armAngle > THRESHOLD_DOWN) {
    if (newState.phase === 'up' && newState.repCounted) {
      newState.repCounted = false;
    }
    newState.phase = 'down';
    feedback = 'Good! Now curl up';
  } else if (armAngle < THRESHOLD_UP) {
    if (newState.phase === 'down' && !newState.repCounted) {
      shouldCountRep = true;
      newState.repCounted = true;
      feedback = 'Excellent rep!';
    }
    newState.phase = 'up';
  } else {
    // Intermediate phase
    if (newState.phase === 'down') feedback = 'Keep curling...';
    else if (newState.phase === 'up') feedback = 'Lower slowly...';
  }

  // Strict posture check: Elbow drift and Shoulder movement
  const shoulder = hasLeftArm ? leftShoulder : rightShoulder;
  const elbow = hasLeftArm ? leftElbow : rightElbow;
  if (shoulder && elbow) {
    const elbowDrift = Math.abs(shoulder!.x - elbow!.x);
    if (elbowDrift > 60) {
      feedback = 'Keep your elbows tucked in';
      isCorrectPosture = false;
    }
  }

  return { isCorrectPosture, feedback, shouldCountRep, newState };
}

// Analyze Squats (Improved Scaling/Normalize)
export function analyzeSquats(keypoints: Keypoint[], state: ExerciseState): AnalysisResult {
  let leftHip = getKeypoint(keypoints, 'leftHip');
  let leftKnee = getKeypoint(keypoints, 'leftKnee');
  let leftAnkle = getKeypoint(keypoints, 'leftAnkle');
  let rightHip = getKeypoint(keypoints, 'rightHip');
  let rightKnee = getKeypoint(keypoints, 'rightKnee');
  let rightAnkle = getKeypoint(keypoints, 'rightAnkle');

  if (leftHip) leftHip = smoothKeypoint(leftHip, 'leftHip');
  if (leftKnee) leftKnee = smoothKeypoint(leftKnee, 'leftKnee');
  if (leftAnkle) leftAnkle = smoothKeypoint(leftAnkle, 'leftAnkle');
  if (rightHip) rightHip = smoothKeypoint(rightHip, 'rightHip');
  if (rightKnee) rightKnee = smoothKeypoint(rightKnee, 'rightKnee');
  if (rightAnkle) rightAnkle = smoothKeypoint(rightAnkle, 'rightAnkle');

  const hasLeftLeg = leftHip && leftKnee && leftAnkle;
  const hasRightLeg = rightHip && rightKnee && rightAnkle;

  if (!hasLeftLeg && !hasRightLeg) {
    return { isCorrectPosture: false, feedback: 'Show your legs for tracking', shouldCountRep: false, newState: state };
  }

  const leftKneeAngle = hasLeftLeg ? calculateAngle(leftHip!, leftKnee!, leftAnkle!) : 180;
  const rightKneeAngle = hasRightLeg ? calculateAngle(rightHip!, rightKnee!, rightAnkle!) : 180;
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const torsoLen = getTorsoLength(keypoints);
  const knee = hasLeftLeg ? leftKnee : rightKnee;
  const ankle = hasLeftLeg ? leftAnkle : rightAnkle;
  
  let feedback = 'Nice depth!';
  let isCorrectPosture = true;

  // Better knee alignment check using torso length for scaling
  if (knee && ankle) {
    const kneeToToeDistance = Math.abs(knee.x - ankle.x);
    if (kneeToToeDistance > torsoLen * 0.4) {
      feedback = 'Don\'t let knees go too far past toes';
      isCorrectPosture = false;
    }
  }

  const newState = { ...state };
  let shouldCountRep = false;

  // Hysteresis thresholds for Squats
  const THRESHOLD_DOWN = 95;
  const THRESHOLD_UP = 165;

  if (avgKneeAngle < THRESHOLD_DOWN) {
    newState.phase = 'down';
    newState.repCounted = false;
    feedback = 'Great depth! Stand up';
  } else if (avgKneeAngle > THRESHOLD_UP) {
    if (newState.phase === 'down' && !newState.repCounted) {
      shouldCountRep = true;
      newState.repCounted = true;
      feedback = 'Rep counted!';
    }
    newState.phase = 'up';
  } else {
    if (newState.phase === 'up') feedback = 'Go deeper...';
  }

  return { isCorrectPosture, feedback, shouldCountRep, newState };
}

// Analyze Jumping Jacks (Improved)
export function analyzeJumpingJacks(keypoints: Keypoint[], state: ExerciseState): AnalysisResult {
  let lShoulder = getKeypoint(keypoints, 'leftShoulder');
  let rShoulder = getKeypoint(keypoints, 'rightShoulder');
  let lWrist = getKeypoint(keypoints, 'leftWrist');
  let rWrist = getKeypoint(keypoints, 'rightWrist');
  let lAnkle = getKeypoint(keypoints, 'leftAnkle');
  let rAnkle = getKeypoint(keypoints, 'rightAnkle');

  if (lShoulder) lShoulder = smoothKeypoint(lShoulder, 'leftShoulder');
  if (rShoulder) rShoulder = smoothKeypoint(rShoulder, 'rightShoulder');
  if (lWrist) lWrist = smoothKeypoint(lWrist, 'leftWrist');
  if (rWrist) rWrist = smoothKeypoint(rWrist, 'rightWrist');
  if (lAnkle) lAnkle = smoothKeypoint(lAnkle, 'leftAnkle');
  if (rAnkle) rAnkle = smoothKeypoint(rAnkle, 'rightAnkle');

  if (!lShoulder || !rShoulder || !lWrist || !rWrist) {
    return { isCorrectPosture: false, feedback: 'Show full body', shouldCountRep: false, newState: state };
  }

  // Use shoulder width as a baseline for horizontal scale
  const shoulderWidth = calculateDistance(lShoulder, rShoulder);
  
  // Arms up: Wrists significantly above shoulders
  const armsUp = lWrist.y < lShoulder.y - 40 && rWrist.y < rShoulder.y - 40;
  
  // Legs spread: Distance between ankles compared to shoulder width
  const ankleDist = (lAnkle && rAnkle) ? Math.abs(lAnkle.x - rAnkle.x) : 0;
  const legsSpread = ankleDist > shoulderWidth * 1.6;

  const newState = { ...state };
  let shouldCountRep = false;
  let feedback = 'Keep jumping!';

  if (armsUp && legsSpread) {
    newState.phase = 'up';
    newState.repCounted = false;
    feedback = 'Jump back together!';
  } else if (!armsUp && !legsSpread) {
    if (newState.phase === 'up' && !newState.repCounted) {
      shouldCountRep = true;
      newState.repCounted = true;
      feedback = 'Great jack!';
    }
    newState.phase = 'down';
  }

  return { isCorrectPosture: true, feedback, shouldCountRep, newState };
}

// Analyze Arm Circles
export function analyzeArmCircles(keypoints: Keypoint[], state: ExerciseState): AnalysisResult {
  let lShoulder = getKeypoint(keypoints, 'leftShoulder');
  let lWrist = getKeypoint(keypoints, 'leftWrist');
  let rShoulder = getKeypoint(keypoints, 'rightShoulder');
  let rWrist = getKeypoint(keypoints, 'rightWrist');

  if (lShoulder) lShoulder = smoothKeypoint(lShoulder, 'leftShoulder');
  if (lWrist) lWrist = smoothKeypoint(lWrist, 'leftWrist');
  if (rShoulder) rShoulder = smoothKeypoint(rShoulder, 'rightShoulder');
  if (rWrist) rWrist = smoothKeypoint(rWrist, 'rightWrist');

  if (!lShoulder || !lWrist || !rShoulder || !rWrist) {
    return { isCorrectPosture: false, feedback: 'Extend arms fully', shouldCountRep: false, newState: state };
  }

  const newState = { ...state };
  let shouldCountRep = false;
  let feedback = 'Circular motion...';

  // Circle detection via simplified quadrant tracking
  const lWristRelY = lWrist.y - lShoulder.y;
  const rWristRelY = rWrist.y - rShoulder.y;

  if (lWristRelY < -50 && rWristRelY < -50) {
    newState.phase = 'up';
    newState.repCounted = false;
  } else if (lWristRelY > 50 && rWristRelY > 50) {
    if (newState.phase === 'up' && !newState.repCounted) {
      shouldCountRep = true;
      newState.repCounted = true;
      feedback = 'Full circle!';
    }
    newState.phase = 'down';
  }

  return { isCorrectPosture: true, feedback, shouldCountRep, newState };
}

// Analyze Shoulder Press
export function analyzeShoulderPress(keypoints: Keypoint[], state: ExerciseState): AnalysisResult {
  let lShoulder = getKeypoint(keypoints, 'leftShoulder');
  let lElbow = getKeypoint(keypoints, 'leftElbow');
  let lWrist = getKeypoint(keypoints, 'leftWrist');
  let rShoulder = getKeypoint(keypoints, 'rightShoulder');
  let rElbow = getKeypoint(keypoints, 'rightElbow');
  let rWrist = getKeypoint(keypoints, 'rightWrist');

  if (lShoulder) lShoulder = smoothKeypoint(lShoulder, 'leftShoulder');
  if (lElbow) lElbow = smoothKeypoint(lElbow, 'leftElbow');
  if (lWrist) lWrist = smoothKeypoint(lWrist, 'leftWrist');
  if (rShoulder) rShoulder = smoothKeypoint(rShoulder, 'rightShoulder');
  if (rElbow) rElbow = smoothKeypoint(rElbow, 'rightElbow');
  if (rWrist) rWrist = smoothKeypoint(rWrist, 'rightWrist');

  const hasLeft = lShoulder && lElbow && lWrist;
  const hasRight = rShoulder && rElbow && rWrist;

  if (!hasLeft && !hasRight) {
    return { isCorrectPosture: false, feedback: 'Position arms clearly', shouldCountRep: false, newState: state };
  }

  const lAngle = hasLeft ? calculateAngle(lShoulder!, lElbow!, lWrist!) : 0;
  const rAngle = hasRight ? calculateAngle(rShoulder!, rElbow!, rWrist!) : 0;
  const avgAngle = (lAngle + rAngle) / 2;

  const newState = { ...state };
  let shouldCountRep = false;
  let feedback = 'Press overhead!';

  if (avgAngle < 110) {
    newState.phase = 'down';
    newState.repCounted = false;
    feedback = 'Now press up!';
  } else if (avgAngle > 165) {
    if (newState.phase === 'down' && !newState.repCounted) {
      shouldCountRep = true;
      newState.repCounted = true;
      feedback = 'Perfect press!';
    }
    newState.phase = 'up';
  }

  return { isCorrectPosture: true, feedback, shouldCountRep, newState };
}

// Main analysis function
export function analyzeExercise(
  exercise: ExerciseType,
  keypoints: Keypoint[],
  state: ExerciseState
): AnalysisResult {
  switch (exercise) {
    case 'bicep-curls':
      return analyzeBicepCurls(keypoints, state);
    case 'arm-circles':
      return analyzeArmCircles(keypoints, state);
    case 'shoulder-press':
      return analyzeShoulderPress(keypoints, state);
    case 'squats':
      return analyzeSquats(keypoints, state);
    case 'jumping-jacks':
      return analyzeJumpingJacks(keypoints, state);
    default:
      return { isCorrectPosture: false, feedback: 'Select an exercise', shouldCountRep: false, newState: state };
  }
}

// Calculate calories burned (Improved calculation)
export function calculateCalories(
  metValue: number,
  weightKg: number,
  durationMinutes: number
): number {
  const hours = durationMinutes / 60;
  // Dynamic scaling based on intensity (simplified for now)
  return Math.round(metValue * weightKg * hours);
}
