import { create } from 'zustand';

interface SOSState {
  isSOSActive: boolean;
  sosSeverity: string | null;
  acknowledged: boolean;
  triggerSOS: (severity?: string) => void;
  acknowledgeSOS: () => void;
  resetSOS: () => void;
}

export const useSOSStore = create<SOSState>((set) => ({
  isSOSActive: false,
  sosSeverity: null,
  acknowledged: false,
  triggerSOS: (severity = 'HIGH') => set({ isSOSActive: true, sosSeverity: severity, acknowledged: false }),
  acknowledgeSOS: () => set({ acknowledged: true }),
  resetSOS: () => set({ isSOSActive: false, sosSeverity: null, acknowledged: false }),
}));
