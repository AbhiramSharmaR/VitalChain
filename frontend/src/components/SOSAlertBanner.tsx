import React from 'react';
import { AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import { useSOSStore } from '@/store/sosStore';

const SOSAlertBanner: React.FC = () => {
    const { isSOSActive, sosSeverity, acknowledged, acknowledgeSOS } = useSOSStore();

    if (!isSOSActive || acknowledged) return null;

    return (
        <div className="sos-banner text-white rounded-b-xl animate-fade-in z-50 fixed top-0 inset-x-0 w-full md:w-3/4 max-w-4xl mx-auto shadow-[0_10px_30px_rgba(255,0,0,0.5)]">
            <div className="flex flex-col md:flex-row items-center justify-between w-full p-2 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <div className="relative animate-pulse">
                        <AlertTriangle className="w-10 h-10 text-yellow-300 drop-shadow-md" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-widest text-white drop-shadow-sm flex items-center gap-2 uppercase">
                            🚨 Emergency Alert Active
                        </h2>
                        <div className="flex items-center space-x-3 mt-1 text-sm md:text-base">
                            <span className="font-semibold px-2 py-0.5 bg-red-800 rounded-md shadow-inner text-red-100">
                                Patient: <span className="text-white">John Doe</span>
                            </span>
                            <span className="font-semibold px-2 py-0.5 bg-red-800 rounded-md shadow-inner text-red-100">
                                Severity: <span className="text-white font-bold">{sosSeverity || 'HIGH'}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={acknowledgeSOS}
                    className="flex items-center space-x-2 bg-white text-red-700 hover:bg-red-50 px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 group w-full md:w-auto justify-center"
                >
                    <Navigation className="w-5 h-5 group-hover:block hidden" />
                    <CheckCircle className="w-5 h-5 group-hover:hidden block" />
                    <span className="tracking-wide">ACKNOWLEDGE</span>
                </button>
            </div>
        </div>
    );
};

export default SOSAlertBanner;
