import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { useSOSStore } from '@/store/sosStore';
import { useVitals } from '@/hooks/useVitals';
import { useMap } from '@/hooks/useMap';
import { MapView } from '@/components/MapView';
import { Chatbot } from '@/components/Chatbot';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Activity, Heart, Droplets, Clock, ShieldAlert, MapPinOff } from 'lucide-react';

const SOSPage: React.FC = () => {
    const userId = "test-user-123";
    useVitals(userId);
    useMap(userId);

    const vitals = useSOSStore((state) => state.vitals);
    const triageLevel = useSOSStore((state) => state.triageLevel);
    const emergencyState = useSOSStore((state) => state.emergencyState);
    const latency = useSOSStore((state) => state.latency);
    const responderInfo = useSOSStore((state) => state.responderInfo);
    const mapData = useSOSStore((state) => state.mapData);
    const cancelEmergency = useSOSStore((state) => state.cancelEmergency);
    const startEscalationSimulation = useSOSStore((state) => state.startEscalationSimulation);

    // Location Permission Hook logic
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'error' | 'unsupported'>('idle');
    const [coords, setCoords] = useState<{lat: number; lng: number} | null>(null);

    const requestLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationStatus('unsupported');
            return;
        }

        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'https:') {
            setLocationStatus('unsupported');
            return;
        }

        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
                setLocationStatus('granted');
            },
            (error) => {
                setLocationStatus(error.code === 1 ? 'denied' : 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Auto-request location when viewing monitoring page
    useEffect(() => {
        if (emergencyState === 'MONITORING' && locationStatus === 'idle') {
            requestLocation();
        }
    }, [emergencyState, locationStatus]);

    // Color theme based on state
    let bgColor = 'bg-background';
    let borderColor = 'border-success/30';
    let textColor = 'text-success';
    let statusMessage = "Monitoring vitals...";
    let pulseEffect = '';

    if (emergencyState === 'ALERT') {
        bgColor = 'bg-destructive/5';
        borderColor = 'border-destructive';
        textColor = 'text-destructive';
        statusMessage = "Emergency triggered automatically";
        pulseEffect = 'animate-pulse';
    } else if (emergencyState.startsWith('ESCALATED')) {
        bgColor = 'bg-destructive/10';
        borderColor = 'border-destructive';
        textColor = 'text-destructive text-shadow-sm';
        if (emergencyState === 'ESCALATED_FAMILY') statusMessage = "Alerting Family Members...";
        else if (emergencyState === 'ESCALATED_APARTMENT') statusMessage = "Alerting Apartment Community...";
        else if (emergencyState === 'ESCALATED_HOSPITAL') statusMessage = "Alerting Hospitals & Ambulances...";
        else statusMessage = "Help is on the way";
    } else if (emergencyState === 'RESPONDER_DISPATCHED') {
        bgColor = 'bg-blue-50';
        borderColor = 'border-blue-500';
        textColor = 'text-blue-700';
        statusMessage = "Responder Assigned!";
        pulseEffect = '';
    } else if (emergencyState === 'CANCELLED') {
        bgColor = 'bg-gray-100';
        borderColor = 'border-gray-400';
        textColor = 'text-gray-600';
        statusMessage = "Emergency Cancelled";
    } else if (triageLevel === 'YELLOW') {
         bgColor = 'bg-warning/10';
         borderColor = 'border-warning';
         textColor = 'text-warning';
         statusMessage = "Abnormal condition detected";
    }

    return (
        <MainLayout>
            <div className={`p-6 transition-colors duration-1000 rounded-xl ${bgColor} ${pulseEffect}`}>
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
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={statusMessage} // re-animate when message changes
                        className={`px-6 py-3 rounded-full border-2 font-bold flex items-center gap-2 ${borderColor} ${textColor} bg-white shadow-sm transition-all duration-300`}
                    >
                        {emergencyState !== 'MONITORING' && <ShieldAlert className="animate-bounce text-red-600" />}
                        {statusMessage}
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {/* Main Content Column */}
                    <div className="space-y-6">
                        
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

                        {/* Tracking Section Elements */}
                        <AnimatePresence>
                            {(emergencyState.startsWith('ESCALATED') || emergencyState === 'RESPONDER_DISPATCHED') && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                                    className="w-full flex justify-center items-center overflow-hidden"
                                >
                                    <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
                                        <AnimatedEmergencyMap 
                                            patientLoc={mapData.patient_location || { lat: 37.7749, lng: -122.4194 }}
                                            responderLoc={mapData.responder_location || { lat: 37.7649, lng: -122.4094 }}
                                            isActive={emergencyState === 'RESPONDER_DISPATCHED'}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Responder Information & Controls */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
                            {responderInfo && (
                                <div className="w-full bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">Responder Information</h3>
                                        <p className="text-md">Name: <span className="font-semibold">{responderInfo.name}</span></p>
                                        <p className="text-md">Status: <span className="font-semibold">{responderInfo.status}</span></p>
                                    </div>
                                    <ShieldAlert className="w-10 h-10 text-blue-500" />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 w-full">
                                {emergencyState === 'MONITORING' || emergencyState === 'CANCELLED' ? (
                                    locationStatus !== 'granted' ? (
                                        <div className="w-full border-2 border-red-600 bg-red-50 text-red-900 rounded-xl p-5 flex flex-col items-center shadow-sm">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <MapPinOff className="w-6 h-6 text-red-600"/> Location Access Required
                                            </h3>
                                            <p className="mt-2 text-center text-sm font-medium">
                                                Emergency services cannot be dispatched without your exact location. This is a critical safety requirement. Please {locationStatus === 'denied' ? 'check your browser permissions and ' : ''}enable location access.
                                            </p>
                                            <button 
                                                onClick={requestLocation} 
                                                disabled={locationStatus === 'loading'}
                                                className="mt-4 bg-red-600 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-red-500 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {locationStatus === 'loading' ? 'Requesting...' : 'Enable Location'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                if (coords) {
                                                    useSOSStore.getState().setMapData({
                                                        ...mapData,
                                                        patient_location: coords
                                                    });
                                                }
                                                startEscalationSimulation();
                                            }}
                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
                                        >
                                            Simulate SOS Trigger
                                        </button>
                                    )
                                ) : (
                                    <button 
                                        onClick={cancelEmergency}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
                                    >
                                        Cancel Emergency
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Latency Display */}
                        <AnimatePresence>
                            {emergencyState !== 'MONITORING' && emergencyState !== 'CANCELLED' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-xl shadow-sm border border-red-100 p-5 flex flex-col md:flex-row items-center justify-between text-gray-700 gap-4"
                                >
                                    <div className="flex items-center gap-2 font-bold text-gray-800 tracking-wide text-lg">
                                        <Clock className="text-blue-500" /> Response Metrics
                                    </div>
                                    <div className="flex gap-4 text-sm font-semibold">
                                        {latency.total_response_time_sec !== null && latency.total_response_time_sec !== undefined && (
                                            <motion.div key={latency.total_response_time_sec} initial={{ scale: 1.1, backgroundColor: '#dbeafe' }} animate={{ scale: 1, backgroundColor: '#eff6ff' }} className="px-4 py-2 rounded-lg text-blue-800 shadow-sm border border-blue-100">
                                            Response time: <span className="text-lg ml-1">{latency.total_response_time_sec}s</span>
                                            </motion.div>
                                        )}
                                        {latency.time_to_escalation_sec !== null && latency.time_to_escalation_sec !== undefined && (
                                            <motion.div key={latency.time_to_escalation_sec} initial={{ scale: 1.1, backgroundColor: '#f3e8ff' }} animate={{ scale: 1, backgroundColor: '#faf5ff' }} className="px-4 py-2 rounded-lg text-purple-800 shadow-sm border border-purple-100">
                                            Escalated in: <span className="text-lg ml-1">{latency.time_to_escalation_sec}s</span>
                                            </motion.div>
                                        )}
                                        {(latency.total_response_time_sec === null || latency.total_response_time_sec === undefined) && 
                                        (latency.time_to_escalation_sec === null || latency.time_to_escalation_sec === undefined) && (
                                            <div className="text-red-500 animate-pulse font-medium bg-red-50 px-4 py-2 rounded-lg">Tracking automated response...</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
        </MainLayout>
    );
};

interface AnimatedEmergencyMapProps {
  patientLoc: { lat: number; lng: number };
  responderLoc: { lat: number; lng: number };
  isActive: boolean;
}

export const AnimatedEmergencyMap: React.FC<AnimatedEmergencyMapProps> = ({
  patientLoc,
  responderLoc,
  isActive
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const mapRef = useRef<any>(null);
  const responderMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [currentResponderPos, setCurrentResponderPos] = useState(responderLoc);
  
  useEffect(() => {
    if (!responderMarkerRef.current || !window.google) return;
    
    const startPos = responderMarkerRef.current.getPosition() || new window.google.maps.LatLng(currentResponderPos);
    const endPos = new window.google.maps.LatLng(responderLoc);
    
    const heading = window.google.maps.geometry?.spherical?.computeHeading(startPos, endPos) || 0;
    
    const startTime = performance.now();
    const duration = 1500; // 1.5s interpolation
    
    let animationFrameId: number;
    
    const animate = (time: number) => {
       const elapsed = time - startTime;
       const progress = Math.min(elapsed / duration, 1);
       const ease = 1 - (1 - progress) * (1 - progress); // easeOutQuad
       
       const lat = startPos.lat() + (endPos.lat() - startPos.lat()) * ease;
       const lng = startPos.lng() + (endPos.lng() - startPos.lng()) * ease;
       
       const newPos = new window.google.maps.LatLng(lat, lng);
       responderMarkerRef.current?.setPosition(newPos);
       
       const pPath = polylineRef.current?.getPath();
       if (pPath && pPath.getLength() > 0) {
          pPath.setAt(0, newPos);
       }
       
       responderMarkerRef.current?.setIcon({
         path: 1, // FORWARD_CLOSED_ARROW
         scale: 6,
         fillColor: "#3b82f6",
         fillOpacity: 1,
         strokeWeight: 2,
         strokeColor: "#ffffff",
         rotation: heading
       });
       
       if (progress < 1) {
         animationFrameId = requestAnimationFrame(animate);
       } else {
         setCurrentResponderPos({ lat, lng });
         if (mapRef.current) {
            mapRef.current.panTo(newPos);
         }
       }
    };
    
    if (startPos.lat() !== endPos.lat() || startPos.lng() !== endPos.lng()) {
        animationFrameId = requestAnimationFrame(animate);
    }
    
    return () => {
       if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [responderLoc]);

  // Route pulse styling
  const options = {
    strokeColor: '#3b82f6',
    strokeOpacity: 0.5,
    strokeWeight: 4,
    icons: [{
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
      offset: '0',
      repeat: '20px'
    }]
  };

  if (!isLoaded) return <div className="animate-pulse bg-gray-100 h-64 md:h-96 w-full rounded-xl flex items-center justify-center text-gray-500">Loading Dispatch Map...</div>;

  return (
    <div className="h-64 md:h-96 w-full relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={patientLoc}
        zoom={14}
        onLoad={(map) => { mapRef.current = map; }}
        options={{ disableDefaultUI: true, gestureHandling: 'cooperative' }}
      >
        <Marker 
          position={patientLoc} 
          icon={{
             url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E",
             scaledSize: window.google ? new window.google.maps.Size(40,40) : null
          }} 
        />
        <Marker
          position={undefined}
          onLoad={(m) => { responderMarkerRef.current = m; m.setPosition(currentResponderPos); }}
          icon={{ path: 1, scale: 6, fillColor: "#3b82f6", fillOpacity: 1, strokeWeight: 2, strokeColor: "#ffffff", rotation: 0 }}
        />
        {isActive && (
          <Polyline 
            path={[currentResponderPos, patientLoc]} 
            options={options} 
            onLoad={(p) => { polylineRef.current = p; }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default SOSPage;
