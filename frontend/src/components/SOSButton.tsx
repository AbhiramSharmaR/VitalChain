import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSOSStore } from '@/store/sosStore';
import { useNavigate } from 'react-router-dom';

const SOSButton: React.FC = () => {
    const { triggerSOS, isSOSActive } = useSOSStore();
    const navigate = useNavigate();

    const handleSOSClick = async () => {
        if (!isSOSActive) {
            triggerSOS('HIGH');
            try {
                await fetch('http://localhost:8000/alerts/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: 'test-user-123', reason: "SOS Button Pressed" })
                });
            } catch (error) {
                console.error("Failed to trigger backend alert from SOS Button", error);
            }
            navigate('/sos');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <button
                onClick={handleSOSClick}
                className="sos-button"
                aria-label="Trigger SOS Emergency"
            >
                <div className="flex flex-col items-center justify-center z-10 transition-transform duration-200">
                    <AlertTriangle className="w-12 h-12 mb-1" strokeWidth={2.5} />
                    <span className="font-bold text-xl tracking-wider">SOS</span>
                </div>
            </button>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-center mt-6">
                Press for Emergency Help
            </p>
        </div>
    );
};

export default SOSButton;
