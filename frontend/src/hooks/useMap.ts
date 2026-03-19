import { useEffect } from 'react';
import { useSOSStore } from '../store/sosStore';
import { getMapData, getVitals } from '../api/emergency';

export const useMap = (userId: string) => {
  const emergencyState = useSOSStore((state) => state.emergencyState);
  const setMapData = useSOSStore((state) => state.setMapData);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const fetchMap = async () => {
      // 6. Map Trigger Logic: Frontend MUST call map API ONLY when state === "ESCALATED"
      if (emergencyState === 'ESCALATED') {
        try {
          const vitals = await getVitals(userId);
          if (vitals.emergency_id) {
            const mapRes = await getMapData(vitals.emergency_id);
            setMapData(mapRes);
          }
        } catch (error) {
          console.error("Failed to fetch map data", error);
        }
      }
    };

    if (emergencyState === 'ESCALATED') {
       interval = setInterval(fetchMap, 3000);
    }
    
    return () => clearInterval(interval);
  }, [userId, emergencyState, setMapData]);
};
