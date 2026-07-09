import { useState, useCallback } from 'react';
import { trainingService } from '../services/trainingService';
import { TrainingCourse, AssessmentResult, SubmitAssessmentRequest } from '../types';

export function useTraining() {
  const [courses,   setCourses]   = useState<TrainingCourse[]>([]);
  const [isLoading, setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trainingService.getCourses();
      setCourses(res.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAssessment = useCallback(
    async (payload: SubmitAssessmentRequest): Promise<AssessmentResult | null> => {
      try {
        return await trainingService.submitAssessment(payload);
      } catch {
        return null;
      }
    },
    [],
  );

  return { courses, isLoading, error, fetchCourses, submitAssessment };
}
