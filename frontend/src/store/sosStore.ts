import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export interface EmergencyDetails {
  id: string;
  patientName: string;
  location: string;
}

export interface ResponderInfo {
  name: string;
  status: string; // 'En route', 'Arrived', etc.
}

interface SOSState {
  vitals: Vitals;
  triageLevel: string;
  emergencyState: string; // MONITORING, ALERT, ESCALATED_FAMILY, ESCALATED_APARTMENT, ESCALATED_HOSPITAL, RESPONDER_DISPATCHED, CANCELLED
  latency: Latency;
  mapData: MapData;
  chatbotMessages: ChatMessage[];
  
  // Receiver State
  incomingEmergency: boolean;
  activeEmergencyDetails: EmergencyDetails | null;
  
  // Sender State
  responderInfo: ResponderInfo | null;
  
  setVitalsData: (data: Partial<SOSState>) => void;
  setMapData: (data: MapData) => void;
  addChatMessage: (msg: ChatMessage) => void;
  
  // New actions
  triggerIncomingEmergency: (details: EmergencyDetails) => void;
  acceptEmergency: () => void;
  ignoreEmergency: () => void;
  cancelEmergency: () => void;
  setResponderInfo: (info: ResponderInfo | null) => void;
  setEmergencyState: (state: string) => void;
  startEscalationSimulation: () => void;
  clearEscalationSimulation: () => void;

  // Legacy compatible properties
  isSOSActive: boolean;
  sosSeverity: string;
  acknowledged: boolean;
  acknowledgeSOS: () => void;
}

let escalationTimeout1: ReturnType<typeof setTimeout> | null = null;
let escalationTimeout2: ReturnType<typeof setTimeout> | null = null;

export const useSOSStore = create<SOSState>()(
  persist(
    (set, get) => ({
  vitals: { heart_rate: null, spo2: null },
  triageLevel: 'GREEN',
  emergencyState: 'MONITORING',
  latency: { time_to_escalation_sec: null, total_response_time_sec: null },
  mapData: { patient_location: null, responder_location: null, eta: null },
  chatbotMessages: [],
  
  incomingEmergency: false,
  activeEmergencyDetails: null,
  responderInfo: null,
  
  isSOSActive: false,
  sosSeverity: 'HIGH',
  acknowledged: false,
  
  setVitalsData: (data) => set((state) => ({ ...state, ...data })),
  setMapData: (mapData) => set({ mapData }),
  addChatMessage: (msg) => set((state) => ({ chatbotMessages: [...state.chatbotMessages, msg] })),
  
  triggerIncomingEmergency: (details) => {
    set({ incomingEmergency: true, activeEmergencyDetails: details });
  },
  acceptEmergency: () => {
    set({ incomingEmergency: false, responderInfo: { name: 'Hospital Responder', status: 'En route' }, emergencyState: 'RESPONDER_DISPATCHED', acknowledged: true });
    get().clearEscalationSimulation();
  },
  ignoreEmergency: () => {
    set({ incomingEmergency: false });
  },
  cancelEmergency: () => {
    set({ emergencyState: 'CANCELLED', responderInfo: null, incomingEmergency: false, activeEmergencyDetails: null, isSOSActive: false });
    get().clearEscalationSimulation();
  },
  setResponderInfo: (info) => set({ responderInfo: info }),
  setEmergencyState: (state) => set({ emergencyState: state }),
  acknowledgeSOS: () => set({ acknowledged: true }),
  
  startEscalationSimulation: () => {
    // Start at family level
    set({ emergencyState: 'ESCALATED_FAMILY', isSOSActive: true, acknowledged: false, latency: { time_to_escalation_sec: 0, total_response_time_sec: null } });
    
    // Trigger receiver UI to show overlay (now intended for Family Dashboard)
    get().triggerIncomingEmergency({
      id: 'SOS-' + Date.now(),
      patientName: 'John Doe (Simulated)',
      location: '123 Main St, Apt 4B',
    });
    
    // Scale to apartment level after 150 seconds
    escalationTimeout1 = setTimeout(() => {
      set({ emergencyState: 'ESCALATED_APARTMENT', latency: { time_to_escalation_sec: 150, total_response_time_sec: null } });
    }, 150000);

    // Scale to hospital/ambulance after 300 seconds (150s after apartment)
    escalationTimeout2 = setTimeout(() => {
      set({ emergencyState: 'ESCALATED_HOSPITAL', latency: { time_to_escalation_sec: 300, total_response_time_sec: null } });
    }, 300000);
  },
  
  clearEscalationSimulation: () => {
    if (escalationTimeout1) clearTimeout(escalationTimeout1);
    if (escalationTimeout2) clearTimeout(escalationTimeout2);
  }
    }),
    {
      name: 'sos-storage',
      partialize: (state) => ({
        emergencyState: state.emergencyState,
        incomingEmergency: state.incomingEmergency,
        activeEmergencyDetails: state.activeEmergencyDetails,
        responderInfo: state.responderInfo,
        latency: state.latency,
        isSOSActive: state.isSOSActive,
        acknowledged: state.acknowledged
      }),
    }
  )
);
