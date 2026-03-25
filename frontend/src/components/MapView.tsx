import React from 'react';
import { useSOSStore } from '../store/sosStore';
import { MapPin, Navigation } from 'lucide-react';

export const MapView: React.FC = () => {
  const mapData = useSOSStore((state) => state.mapData);
  const emergencyState = useSOSStore((state) => state.emergencyState);

  if (emergencyState !== 'ESCALATED') {
    return (
      <div className="flex items-center justify-center p-6 border-2 border-dashed border-muted rounded-xl bg-card h-64 shadow-sm">
        <p className="text-muted-foreground font-medium">Map tracking activates upon standard escalation.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col h-72 relative overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Real-time Response Map</h3>
      <div className="flex-1 rounded-xl relative bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden border border-blue-100 dark:border-blue-900/50">
        
        {/* SVG Decorative Grid Background */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" className="text-blue-500" />
            
            {/* Simple animated dash line from Responder to Patient */}
            <path d="M 15% 50% Q 50% 20% 85% 50%" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="10 10" className="animate-[dash_1s_linear_infinite]" />
        </svg>

        <style>{`
            @keyframes dash {
                to { stroke-dashoffset: -20; }
            }
        `}</style>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           {mapData.patient_location ? (
              <div className="w-full h-full relative">
                 
                 {/* Responder Pin (Left side) */}
                 <div className="absolute left-[15%] top-[50%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="bg-blue-600 text-white p-2 text-xs rounded-full shadow-lg mb-1 animate-pulse flex items-center gap-1 font-bold z-10 w-max">
                        <Navigation className="w-3 h-3 fill-current" /> EMS DISPATCH
                    </div>
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md"></div>
                 </div>

                 {/* Patient Pin (Right side) */}
                 <div className="absolute left-[85%] top-[50%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="bg-red-600 text-white p-2 text-xs rounded-full shadow-lg mb-1 flex items-center gap-1 font-bold z-10 w-max">
                        <MapPin className="w-3 h-3" /> PATIENT
                    </div>
                    <div className="w-4 h-4 bg-red-600 rounded-full border-4 border-white shadow-md animate-pulse"></div>
                 </div>
                 
                 {/* ETA Badge */}
                 {mapData.eta && (
                    <div className="absolute left-[50%] top-[30%] -translate-x-1/2 bg-white dark:bg-card border-2 border-red-500 text-red-600 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                        <span>ETA: {mapData.eta}</span>
                    </div>
                 )}
              </div>
           ) : (
             <p className="text-muted-foreground animate-pulse font-medium">Connecting to dispatch GPS...</p>
           )}
        </div>
      </div>
    </div>
  );
};
