import axios from 'axios';
import type { LessonAuthoring, ImportLessonPayload } from '../types/authoring';

const API_BASE_URL = 'http://localhost:3000/api/authoring/lessons';

export const authoringApi = {
  createLesson: async (lessonData: Partial<LessonAuthoring>): Promise<LessonAuthoring> => {
    const res = await axios.post(`${API_BASE_URL}/create`, lessonData);
    return res.data;
  },

  updateLesson: async (id: string, lessonData: Partial<LessonAuthoring>): Promise<LessonAuthoring> => {
    const res = await axios.put(`${API_BASE_URL}/${id}`, lessonData);
    return res.data;
  },

  getLessons: async (): Promise<LessonAuthoring[]> => {
    const res = await axios.get(API_BASE_URL);
    return res.data;
  },

  getLessonById: async (id: string): Promise<LessonAuthoring> => {
    const res = await axios.get(`${API_BASE_URL}/${id}`);
    return res.data;
  },

  exportLessonJson: async (id: string): Promise<ImportLessonPayload> => {
    const res = await axios.get(`${API_BASE_URL}/export/${id}`);
    return res.data;
  },

  importLessonJson: async (payload: ImportLessonPayload): Promise<LessonAuthoring> => {
    const res = await axios.post(`${API_BASE_URL}/import`, payload);
    return res.data;
  },

  deleteLesson: async (id: string): Promise<{ message: string }> => {
    const res = await axios.delete(`${API_BASE_URL}/${id}`);
    return res.data;
  },
};
