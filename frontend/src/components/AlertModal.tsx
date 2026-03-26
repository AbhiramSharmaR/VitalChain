import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/api/client';

export const AlertModal: React.FC = () => {
    const { user } = useAuthStore();
    const [alert, setAlert] = useState<any>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/alerts');

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'alert_triggered') {
                    setAlert(data.data);
                } else if (data.event === 'alert_acknowledged') {
                    setAlert((prev) => {
                        if (prev && prev.id === data.data.id) return null;
                        return prev;
                    });
                }
            } catch (e) {
                console.error("WS parse error", e);
            }
        };

        return () => ws.close();
    }, [user, alert]);

    const handleAcknowledge = async () => {
        if (!alert) return;
        try {
            await apiClient.post(`/alerts/${alert.id}/acknowledge`, {
                acknowledged_by: user?.id || 'responder-1',
            });
            setAlert(null);
        } catch (e) {
            console.error('Failed to acknowledge', e);
        }
    };

    if (!alert) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border-l-4 border-red-500 animate-in fade-in zoom-in">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <ShieldAlert className="w-8 h-8 animate-pulse" />
                    <h2 className="text-2xl font-bold">EMERGENCY ALERT</h2>
                </div>
                <div className="space-y-3 mb-6">
                    <p><strong>Patient ID:</strong> {alert.user_id}</p>
                    <p><strong>Triage Level:</strong> <span className="bg-red-500 text-white px-2 py-1 rounded font-bold tracking-wider">{alert.triage_level || 'RED'}</span></p>
                    <p><strong>Reason:</strong> {alert.reason}</p>
                    <p className="text-sm text-gray-500 italic">Escalation in progress...</p>
                </div>
                <Button onClick={handleAcknowledge} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg">
                    ACKNOWLEDGE
                </Button>
            </div>
        </div>
    );
};
