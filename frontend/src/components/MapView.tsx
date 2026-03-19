import React from 'react';
import { useSOSStore } from '../store/sosStore';

export const MapView: React.FC = () => {
  const mapData = useSOSStore((state) => state.mapData);
  const emergencyState = useSOSStore((state) => state.emergencyState);

  if (emergencyState !== 'ESCALATED') {
    return (
      <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 h-64">
        <p className="text-gray-500 font-medium">Map tracking activates upon standard escalation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-64 relative overflow-hidden">
      <h3 className="text-lg font-semibold mb-2">Real-time Response Map</h3>
      <div className="flex-1 bg-green-50 rounded relative">
        {/* Simple visual fallback if no real map library is used */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-green-700">
           {mapData.patient_location ? (
              <div className="flex flex-col items-center gap-2">
                 <div className="p-2 bg-blue-100 text-blue-800 rounded-full font-bold">🗺️ Tracking Responder</div>
                 <p className="text-sm">Patient: {mapData.patient_location.lat.toFixed(4)}, {mapData.patient_location.lng.toFixed(4)}</p>
                 {mapData.responder_location && (
                    <p className="text-sm">Responder: {mapData.responder_location.lat.toFixed(4)}, {mapData.responder_location.lng.toFixed(4)}</p>
                 )}
                 {mapData.eta && (
                    <p className="text-sm font-semibold mt-2 text-red-600">ETA: {mapData.eta}</p>
                 )}
              </div>
           ) : (
             <p className="text-gray-500 animate-pulse">Connecting to dispatch GPS...</p>
           )}
        </div>
      </div>
    </div>
  );
};
