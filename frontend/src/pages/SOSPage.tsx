import React from 'react';
import { useSOSStore } from '@/store/sosStore';
import { useVitals } from '@/hooks/useVitals';
import { useMap } from '@/hooks/useMap';
import { MapView } from '@/components/MapView';
import { Chatbot } from '@/components/Chatbot';
import { Activity, Heart, Droplets, Clock, ShieldAlert } from 'lucide-react';

const SOSPage: React.FC = () => {
    const userId = "test-user-123";
    useVitals(userId);
    useMap(userId);

    const vitals = useSOSStore((state) => state.vitals);
    const triageLevel = useSOSStore((state) => state.triageLevel);
    const emergencyState = useSOSStore((state) => state.emergencyState);
    const latency = useSOSStore((state) => state.latency);

    // Color theme based on state
    let bgColor = 'bg-emerald-50';
    let borderColor = 'border-emerald-200';
    let textColor = 'text-emerald-800';
    let statusMessage = "Monitoring vitals...";

    if (emergencyState === 'ALERT') {
        bgColor = 'bg-red-50 animate-pulse';
        borderColor = 'border-red-400';
        textColor = 'text-red-700';
        statusMessage = "Emergency triggered automatically";
    } else if (emergencyState === 'ESCALATED') {
        bgColor = 'bg-red-100';
        borderColor = 'border-red-500';
        textColor = 'text-red-800';
        statusMessage = "Help is on the way";
    } else if (triageLevel === 'YELLOW') {
         bgColor = 'bg-yellow-50';
         borderColor = 'border-yellow-300';
         textColor = 'text-yellow-800';
         statusMessage = "Abnormal condition detected";
    }

    return (
        <div className={`min-h-screen p-6 transition-colors duration-1000 ${bgColor}`}>
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                           <Activity className={textColor} /> Autonomous Health Monitor
                        </h1>
                        <p className="text-gray-600 mt-1 text-center md:text-left">Real-time continuous patient tracking</p>
                    </div>
                    {/* Status Badge */}
                    <div className={`px-6 py-3 rounded-full border-2 font-bold flex items-center gap-2 ${borderColor} ${textColor} bg-white shadow-sm transition-all duration-300`}>
                        {emergencyState !== 'MONITORING' && <ShieldAlert className="animate-bounce text-red-600" />}
                        {statusMessage}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Vitals Panel */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-8 justify-around items-center">
                            <div className="text-center w-full md:w-auto">
                                <div className="flex items-center justify-center gap-2 mb-2 text-gray-500">
                                   <Heart className="w-5 h-5 text-rose-500" /> Heart Rate
                                </div>
                                <span className={`text-6xl font-black transition-colors duration-300 ${vitals.heart_rate && vitals.heart_rate > 100 ? 'text-red-500' : 'text-gray-800'}`}>
                                    {vitals.heart_rate || '--'}
                                </span>
                                <span className="text-sm text-gray-400 ml-1 font-medium tracking-wide">BPM</span>
                            </div>
                            
                            <div className="w-full h-px md:w-px md:h-24 bg-gray-100"></div>

                            <div className="text-center w-full md:w-auto">
                                <div className="flex items-center justify-center gap-2 mb-2 text-gray-500">
                                   <Droplets className="w-5 h-5 text-blue-500" /> SpO2
                                </div>
                                <span className={`text-6xl font-black transition-colors duration-300 ${vitals.spo2 && vitals.spo2 < 95 ? 'text-red-500' : 'text-gray-800'}`}>
                                    {vitals.spo2 || '--'}
                                </span>
                                <span className="text-sm text-gray-400 ml-1 font-medium tracking-wide">%</span>
                            </div>

                            <div className="w-full h-px md:w-px md:h-24 bg-gray-100"></div>

                            <div className="text-center w-full md:w-auto">
                                <div className="text-gray-500 mb-3 font-medium">Triage Level</div>
                                <div className={`px-6 py-2 rounded-xl font-bold text-white shadow-sm tracking-wide transition-all duration-500 ${triageLevel === 'RED' ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30' : triageLevel === 'YELLOW' ? 'bg-yellow-500 ring-4 ring-yellow-500/30' : 'bg-emerald-500 ring-4 ring-emerald-500/30'}`}>
                                    {(triageLevel || 'GREEN').toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Map Component */}
                        <MapView />

                        {/* Latency Display */}
                        {emergencyState !== 'MONITORING' && (
                            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 flex flex-col md:flex-row items-center justify-between text-gray-700 gap-4">
                                <div className="flex items-center gap-2 font-bold text-gray-800 tracking-wide text-lg">
                                    <Clock className="text-blue-500" /> Response Metrics
                                </div>
                                <div className="flex gap-4 text-sm font-semibold">
                                    {latency.total_response_time_sec !== null && latency.total_response_time_sec !== undefined && (
                                        <div className="bg-blue-50 px-4 py-2 rounded-lg text-blue-800 shadow-sm border border-blue-100">
                                           Response time: <span className="text-lg ml-1">{latency.total_response_time_sec}s</span>
                                        </div>
                                    )}
                                    {latency.time_to_escalation_sec !== null && latency.time_to_escalation_sec !== undefined && (
                                        <div className="bg-purple-50 px-4 py-2 rounded-lg text-purple-800 shadow-sm border border-purple-100">
                                           Escalated in: <span className="text-lg ml-1">{latency.time_to_escalation_sec}s</span>
                                        </div>
                                    )}
                                    {(latency.total_response_time_sec === null || latency.total_response_time_sec === undefined) && 
                                     (latency.time_to_escalation_sec === null || latency.time_to_escalation_sec === undefined) && (
                                        <div className="text-red-500 animate-pulse font-medium bg-red-50 px-4 py-2 rounded-lg">Tracking automated response...</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chatbot Column */}
                    <div className="lg:col-span-1 shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <Chatbot userId={userId} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SOSPage;
