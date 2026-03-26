// User and Auth Types
export type UserRole = 'patient' | 'family';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  phone_number: string;
  flat_number: string;
  apartment_name: string;
  address: string;
  patient_email?: string;
  patient_phone?: string;
}

// Patient Types
export interface PatientProfile {
  id?: string;
  user_id?: string;
  age: number;
  gender: string;
  blood_group: string;
  allergies: string;
  medical_history: string;
}


// Family Types
export interface FamilyLink {
  patient_user_id: string;
  patient_name?: string;
  relationship?: string;
}

export interface LinkedPatient {
  user_id: string;
  full_name: string;
  email: string;
  profile?: PatientProfile;
}

// Prescription Types
export interface Prescription {
  id: string;
  patient_user_id: string;
  doctor_user_id: string;
  doctor_name?: string;
  diagnosis: string;
  medicines: string[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreatePrescription {
  patient_user_id: string;
  diagnosis: string;
  medicines: string[];
  notes?: string;
}

// Vitals Types
export interface Vitals {
  heart_rate: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  temperature: number;
  oxygen_saturation: number;
  respiratory_rate: number;
  timestamp: string;
}

// AI Types
export interface SymptomCheckInput {
  symptoms: string[];
  additional_info?: string;
}

export interface SymptomCheckResult {
  possible_conditions: string[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AnomalyDetectionResult {
  detected: boolean;
  anomalies: {
    type: string;
    confidence: number;
    location?: { x: number; y: number; width: number; height: number };
  }[];
  summary: string;
}

export interface HealthPrediction {
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  factors: { name: string; impact: number }[];
  recommendations: string[];
}

// API Response Types
export interface ApiError {
  message: string;
  status: number;
}
