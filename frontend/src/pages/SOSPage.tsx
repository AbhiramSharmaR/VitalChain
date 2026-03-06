import React, { useEffect } from 'react';
import { useSOSStore } from '@/store/sosStore';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, Loader2, User } from 'lucide-react';

const SOSPage: React.FC = () => {
    const { isSOSActive, sosSeverity, acknowledged, resetSOS } = useSOSStore();
    const navigate = useNavigate();

    // Redirect if not active and not acknowledged
    useEffect(() => {
        if (!isSOSActive && !acknowledged) {
            navigate('/patient/dashboard');
        }
    }, [isSOSActive, acknowledged, navigate]);

    const handleCancelSOS = () => {
        resetSOS();
        navigate('/patient/dashboard');
    };

    if (!isSOSActive && !acknowledged) return null;

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-1000 ${acknowledged ? 'bg-emerald-900' : 'bg-sos-pulse'}`}>

            {/* Background radial gradient overlay for depth */}
            <div className={`absolute inset-0 z-0 opacity-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${acknowledged ? 'from-emerald-600 via-transparent to-transparent' : 'from-red-600 via-transparent to-transparent'}`} />

            <div className="relative z-10 w-full max-w-2xl text-center space-y-12">

                {/* Header Icon & Title */}
                <div className="space-y-6">
                    <div className="flex justify-center">
                        {acknowledged ? (
                            <div className="animate-scale-in">
                                <CheckCircle2 className="w-32 h-32 text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.7)]" strokeWidth={1.5} />
                            </div>
                        ) : (
                            <div className="animate-heartbeat">
                                <ShieldAlert className="w-32 h-32 text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]" strokeWidth={1.5} />
                            </div>
                        )}
                    </div>

                    <h1 className={`text-5xl md:text-6xl font-black tracking-tight uppercase ${acknowledged ? 'text-emerald-50 text-shadow-sm' : 'text-red-50 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]'}`}>
                        {acknowledged ? 'Help Is On The Way' : 'Emergency Alert Active'}
                    </h1>
                </div>

                {/* Status Card */}
                <div className={`p-8 rounded-3xl backdrop-blur-xl border ${acknowledged ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-red-950/40 border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.3)]'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                        <div className="flex items-center gap-4 text-left">
                            <div className={`p-4 rounded-full ${acknowledged ? 'bg-emerald-800/50' : 'bg-red-800/50'}`}>
                                <User className={`w-8 h-8 ${acknowledged ? 'text-emerald-200' : 'text-red-200'}`} />
                            </div>
                            <div>
                                <p className={`text-sm tracking-widest uppercase font-semibold mb-1 ${acknowledged ? 'text-emerald-400' : 'text-red-400'}`}>
                                    Patient Profile
                                </p>
                                <p className="text-2xl font-bold text-white">John Doe</p>
                            </div>
                        </div>

                        <div className={`w-full md:w-px h-px md:h-16 ${acknowledged ? 'bg-emerald-500/30' : 'bg-red-500/30'}`} />

                        <div className="text-left w-full md:w-auto flex flex-col items-center md:items-start">
                            <p className={`text-sm tracking-widest uppercase font-semibold mb-1 ${acknowledged ? 'text-emerald-400' : 'text-red-400'}`}>
                                Severity Level
                            </p>
                            <div className={`px-4 py-1.5 rounded-full border ${acknowledged ? 'bg-emerald-900/60 border-emerald-400 text-emerald-100' : 'bg-red-900/60 border-red-400 text-red-100'} font-bold`}>
                                {sosSeverity || 'HIGH'}
                            </div>
                        </div>

                    </div>

                    {/* Current Status Footer */}
                    <div className={`mt-8 pt-6 border-t ${acknowledged ? 'border-emerald-500/30' : 'border-red-500/30'} flex items-center justify-center gap-3`}>
                        {!acknowledged ? (
                            <>
                                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                                <p className="text-xl text-red-100 font-medium">Waiting for responder acknowledgement...</p>
                            </>
                        ) : (
                            <p className="text-xl text-emerald-100 font-medium">A responder has acknowledged your emergency.</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-8">
                    <button
                        onClick={handleCancelSOS}
                        className={`px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 border ${acknowledged
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                                : 'bg-red-950 text-red-300 border-red-800 hover:bg-red-900'
                            }`}
                    >
                        CANCEL EMERGENCY
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SOSPage;
