import { create } from 'zustand';

interface Vitals {
  heart_rate: number | null;
  spo2: number | null;
}

interface Latency {
  time_to_escalation_sec: number | null;
  total_response_time_sec: number | null;
}

interface MapData {
  patient_location: { lat: number; lng: number } | null;
  responder_location: { lat: number; lng: number } | null;
  eta: string | null;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface SOSState {
  vitals: Vitals;
  triageLevel: string;
  emergencyState: string; // MONITORING, ALERT, ESCALATED
  latency: Latency;
  mapData: MapData;
  chatbotMessages: ChatMessage[];
  
  setVitalsData: (data: Partial<SOSState>) => void;
  setMapData: (data: MapData) => void;
  addChatMessage: (msg: ChatMessage) => void;
}

export const useSOSStore = create<SOSState>((set) => ({
  vitals: { heart_rate: null, spo2: null },
  triageLevel: 'GREEN',
  emergencyState: 'MONITORING',
  latency: { time_to_escalation_sec: null, total_response_time_sec: null },
  mapData: { patient_location: null, responder_location: null, eta: null },
  chatbotMessages: [],
  
  setVitalsData: (data) => set((state) => ({ ...state, ...data })),
  setMapData: (mapData) => set({ mapData }),
  addChatMessage: (msg) => set((state) => ({ chatbotMessages: [...state.chatbotMessages, msg] }))
}));
