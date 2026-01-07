import api from '../api/index';

export interface JobDescriptionInput {
  title: string;
  industry?: string;
  location?: string;
  salary?: string;
  yearsExperience?: number;
  customContext?: string;
}

export interface CompanyDescriptionInput {
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  customContext?: string;
}

export interface CVSummaryInput {
  cvId: number;
}

export interface CVImprovementInput {
  cvId: number;
}

export interface JobMatchingInput {
  jobId: number;
  cvId: number;
}

export interface ApplicationRankingInput {
  jobId: number;
}

class AIGenerationService {
  async generateJobDescription(input: JobDescriptionInput, customContext?: string): Promise<string> {
    try {
      const payload = customContext ? { ...input, customContext } : input;
      const response = await api.post('/jobs/ai/generate-description', payload);
      return response.data.result || response.data.description;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo mô tả công việc');
    }
  }

  async generateCompanyDescription(input: CompanyDescriptionInput, customContext?: string): Promise<string> {
    try {
      const payload = customContext ? { ...input, customContext } : input;
      const response = await api.post('/companies/ai/generate-description', payload);
      return response.data.result || response.data.description;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo mô tả công ty');
    }
  }

  async generateCVSummary(cvId: number): Promise<string> {
    try {
      const response = await api.post(`/cvs/${cvId}/ai/summary`);
      return response.data.result || response.data.summary;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo tóm tắt CV');
    }
  }

  async getCVImprovementSuggestions(cvId: number): Promise<string> {
    try {
      const response = await api.post(`/cvs/${cvId}/ai/improvements`);
      return response.data.result || response.data.suggestions;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo gợi ý cải thiện CV');
    }
  }

  async analyzeJobCVMatching(jobId: number, cvId: number): Promise<any> {
    try {
      const response = await api.post(`/job-applications/ai/match-analysis`, {
        jobId,
        cvId
      });
      return response.data.result || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể phân tích độ phù hợp');
    }
  }

  async rankApplications(jobId: number): Promise<any[]> {
    try {
      const response = await api.post(`/job-applications/ai/rank/${jobId}`);
      return response.data.result || response.data.rankings;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xếp hạng ứng viên');
    }
  }

  async rankJobsForCV(cvId: number): Promise<any[]> {
    try {
      const response = await api.post(`/cvs/${cvId}/ai/rank-jobs`);
      return response.data.result || response.data.rankings;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xếp hạng công việc phù hợp');
    }
  }
}

export default new AIGenerationService();
