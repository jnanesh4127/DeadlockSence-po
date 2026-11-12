import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../firebase/firebase.ts';
import { 
  BankersInput, 
  BankersResult, 
  ResourceRequestInput, 
  ResourceRequestResult, 
  DeadlockDetectionInput, 
  DeadlockDetectionResult, 
  RAGAnalysisInput, 
  RAGAnalysisResult, 
  RecoveryPlanResult, 
  DeadlockRiskResult 
} from '../algorithms/types.ts';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor to attach Firebase ID Token to requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.warn("Unable to attach auth token to request:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle common error codes
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      const message = data?.message || data?.error || error.message;

      switch (status) {
        case 401:
          console.warn("Authentication required or expired session (401):", message);
          break;
        case 403:
          console.warn("Access forbidden (403):", message);
          break;
        case 404:
          console.warn("Resource not found (404):", message);
          break;
        case 429:
          console.warn("Rate limit exceeded (429):", message);
          break;
        case 500:
          console.error("Internal server error (500):", message);
          break;
      }
    } else if (error.request) {
      console.error("Network or server connection failure:", error.message);
    }
    return Promise.reject(error);
  }
);

export interface SystemHealthStatus {
  backend: string;
  firebaseAdmin: string;
  firestore: string;
  simulationEngine: string;
  adminEmail: string;
  details?: {
    projectId?: string;
    hasServiceAccount?: boolean;
    serverUptime?: number;
    instructions?: string;
  };
}

export interface UserSimulationRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  algorithm: 'bankers' | 'deadlock_detection' | 'rag_analysis';
  resourceNames: string[];
  processNames: string[];
  totalResources: number[];
  allocation: number[][];
  max?: number[][];
  request?: number[][];
  isSafe?: boolean;
  safeSequence?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackSubmission {
  category: 'bug' | 'algorithm_question' | 'feature_request' | 'general';
  rating: number;
  message: string;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  userEmail: string;
  category: string;
  rating: number;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface UserProfileRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  disabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AdminAnalyticsData {
  totalUsers: number;
  totalSimulations: number;
  totalFeedback: number;
  pendingFeedback: number;
  safeSimulationsCount: number;
  unsafeSimulationsCount: number;
  recentActivity: Array<{ id: string; action: string; timestamp: string; user: string }>;
}

// API Methods
export const apiService = {
  // System Health
  async getHealthCheck(): Promise<SystemHealthStatus> {
    const res = await apiClient.get<SystemHealthStatus>('/healthCheck');
    return res.data;
  },

  // Algorithm APIs (All run on backend!)
  async runBankersSafety(input: BankersInput): Promise<BankersResult> {
    const res = await apiClient.post<BankersResult>('/algorithms/bankers/safety', input);
    return res.data;
  },

  async requestResource(input: ResourceRequestInput): Promise<ResourceRequestResult> {
    const res = await apiClient.post<ResourceRequestResult>('/algorithms/bankers/request', input);
    return res.data;
  },

  async runDeadlockDetection(input: DeadlockDetectionInput): Promise<DeadlockDetectionResult> {
    const res = await apiClient.post<DeadlockDetectionResult>('/algorithms/deadlock/detect', input);
    return res.data;
  },

  async analyzeRAG(input: RAGAnalysisInput): Promise<RAGAnalysisResult> {
    const res = await apiClient.post<RAGAnalysisResult>('/algorithms/rag/analyze', input);
    return res.data;
  },

  async calculateRecoveryPlan(input: any): Promise<RecoveryPlanResult> {
    const res = await apiClient.post<RecoveryPlanResult>('/algorithms/deadlock/recover', input);
    return res.data;
  },

  async calculateRiskAssessment(input: BankersInput): Promise<DeadlockRiskResult> {
    const res = await apiClient.post<DeadlockRiskResult>('/algorithms/deadlock/risk-assessment', input);
    return res.data;
  },

  // User Simulations (Firestore via Backend)
  async getSimulations(): Promise<UserSimulationRecord[]> {
    const res = await apiClient.get<UserSimulationRecord[]>('/simulations');
    return res.data;
  },

  async saveSimulation(simulation: Partial<UserSimulationRecord>): Promise<UserSimulationRecord> {
    const res = await apiClient.post<UserSimulationRecord>('/simulations', simulation);
    return res.data;
  },

  async getSimulationById(id: string): Promise<UserSimulationRecord> {
    const res = await apiClient.get<UserSimulationRecord>(`/simulations/${id}`);
    return res.data;
  },

  async updateSimulation(id: string, updates: Partial<UserSimulationRecord>): Promise<UserSimulationRecord> {
    const res = await apiClient.put<UserSimulationRecord>(`/simulations/${id}`, updates);
    return res.data;
  },

  async deleteSimulation(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<{ success: boolean }>(`/simulations/${id}`);
    return res.data;
  },

  // Feedback (Phase 10)
  async submitFeedback(data: FeedbackSubmission): Promise<{ success: boolean; id: string; emailSent: boolean }> {
    const res = await apiClient.post<{ success: boolean; id: string; emailSent: boolean }>('/feedback', data);
    return res.data;
  },

  // Admin APIs (Phase 9 & 13)
  async getAdminUsers(): Promise<UserProfileRecord[]> {
    const res = await apiClient.get<UserProfileRecord[]>('/admin/users');
    return res.data;
  },

  async toggleUserDisabled(uid: string, disabled: boolean): Promise<{ success: boolean }> {
    const res = await apiClient.put<{ success: boolean }>(`/admin/users/${uid}/status`, { disabled });
    return res.data;
  },

  async deleteUser(uid: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<{ success: boolean }>(`/admin/users/${uid}`);
    return res.data;
  },

  async getAdminSimulations(): Promise<UserSimulationRecord[]> {
    const res = await apiClient.get<UserSimulationRecord[]>('/admin/simulations');
    return res.data;
  },

  async getAdminFeedback(): Promise<FeedbackItem[]> {
    const res = await apiClient.get<FeedbackItem[]>('/admin/feedback');
    return res.data;
  },

  async updateFeedbackStatus(id: string, status: 'pending' | 'reviewed' | 'resolved'): Promise<{ success: boolean }> {
    const res = await apiClient.put<{ success: boolean }>(`/admin/feedback/${id}/status`, { status });
    return res.data;
  },

  async deleteFeedback(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<{ success: boolean }>(`/admin/feedback/${id}`);
    return res.data;
  },

  async getAdminAnalytics(): Promise<AdminAnalyticsData> {
    const res = await apiClient.get<AdminAnalyticsData>('/admin/analytics');
    return res.data;
  },

  async exportUsersCSV(): Promise<string> {
    const res = await apiClient.get<string>('/admin/export/users', { responseType: 'text' });
    return res.data;
  },

  async exportSimulationsCSV(): Promise<string> {
    const res = await apiClient.get<string>('/admin/export/simulations', { responseType: 'text' });
    return res.data;
  }
};
