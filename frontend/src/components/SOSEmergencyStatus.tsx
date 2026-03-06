import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useSOSStore } from '@/store/sosStore';
import { useNavigate } from 'react-router-dom';

const SOSEmergencyStatus: React.FC = () => {
    const { isSOSActive, acknowledged } = useSOSStore();
    const navigate = useNavigate();

    // Show status if active, but style changes if acknowledged
    if (!isSOSActive) return null;

    return (
        <div
            onClick={() => navigate('/sos')}
            className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl cursor-pointer flex items-center space-x-4 transition-all duration-300 hover:scale-105 z-50 backdrop-blur-md ${acknowledged
                    ? 'bg-emerald-600/90 border border-emerald-400'
                    : 'bg-red-600/90 border-2 border-red-400 sos-widget-glow'
                }`}
        >
            <div className={`relative flex items-center justify-center p-2 rounded-full ${acknowledged ? 'bg-emerald-500' : 'bg-red-500'} shadow-inner`}>
                <AlertCircle className="w-8 h-8 text-white drop-shadow-md" />
                {!acknowledged && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>
                )}
            </div>
            <div>
                <p className="text-white font-bold text-lg tracking-wide drop-shadow-sm">
                    {acknowledged ? 'Responder Dispatched' : 'Active Emergency'}
                </p>
                <p className="text-white/80 text-sm font-medium">
                    {acknowledged ? 'Help is en route' : 'Tap for details'}
                </p>
            </div>
        </div>
    );
};

export default SOSEmergencyStatus;
