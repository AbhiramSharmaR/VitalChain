import { useEffect } from 'react';
import { useSOSStore } from '../store/sosStore';
import { getVitals, getLatency } from '../api/emergency';

export const useVitals = (userId: string) => {
  const setVitalsData = useSOSStore((state) => state.setVitalsData);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const fetchVitals = async () => {
      try {
        const data = await getVitals(userId);
        if (data && !data.error) {
          const latencyData = await getLatency(userId);
          setVitalsData({
            vitals: { heart_rate: data.heart_rate, spo2: data.spo2 },
            triageLevel: data.triage,
            emergencyState: data.state,
            latency: latencyData
          });
        }
      } catch (error) {
        console.error("Failed to fetch vitals", error);
      }
    };

    interval = setInterval(fetchVitals, 2500); // Poll every 2.5s
    
    return () => clearInterval(interval);
  }, [userId, setVitalsData]);
};
