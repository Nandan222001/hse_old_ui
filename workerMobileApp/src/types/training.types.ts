export type TrainingStatus = 'not_started' | 'in_progress' | 'completed' | 'expired';

export interface LearningObjective {
  icon: string;
  title: string;
  description: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  video_duration_seconds: number;
  estimated_minutes: number;
  xp_reward: number;
  progress_pct: number;
  status: TrainingStatus;
  objectives: LearningObjective[];
  is_mandatory: boolean;
  expires_at?: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

export interface SubmitAssessmentRequest {
  course_id: string;
  answers: { question_id: string; selected_index: number }[];
}

export interface AssessmentResult {
  score: number;
  passed: boolean;
  xp_earned: number;
  certificate_url?: string;
}

export interface TrainingListResponse {
  items: TrainingCourse[];
  total: number;
}
