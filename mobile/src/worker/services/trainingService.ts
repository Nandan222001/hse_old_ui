import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { TrainingCourse, TrainingListResponse, SubmitAssessmentRequest, AssessmentResult } from '../types';

export const trainingService = {
  async getCourses(params?: { status?: string; mandatory?: boolean }): Promise<TrainingListResponse> {
    const { data } = await apiClient.get<TrainingListResponse>(ENDPOINTS.TRAINING.LIST, { params });
    return data;
  },

  async getCourse(id: string): Promise<TrainingCourse> {
    const { data } = await apiClient.get<TrainingCourse>(ENDPOINTS.TRAINING.DETAIL(id));
    return data;
  },

  async submitAssessment(payload: SubmitAssessmentRequest): Promise<AssessmentResult> {
    const { data } = await apiClient.post<AssessmentResult>(
      ENDPOINTS.TRAINING.ASSESSMENT(payload.course_id),
      payload,
    );
    return data;
  },
};
