import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Heart,
  Bell,
  Activity,
  UserPlus,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/common/StatCard';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import SOSAlertBanner from '@/components/SOSAlertBanner';
import SOSEmergencyStatus from '@/components/SOSEmergencyStatus';
import { useSOSStore } from '@/store/sosStore';
import { AnimatedEmergencyMap } from '@/pages/SOSPage';
import { MapPinOff } from 'lucide-react';

const mockLinkedPatients = [
  { id: 1, name: 'Mary Smith', relation: 'Mother', age: 68, condition: 'Diabetes', lastUpdate: '2 hours ago', status: 'stable' },
  { id: 2, name: 'James Smith', relation: 'Father', age: 72, condition: 'Hypertension', lastUpdate: '1 hour ago', status: 'stable' },
];

const mockAlerts = [
  { id: 1, type: 'warning', patient: 'Mary Smith', message: 'Blood sugar levels slightly elevated', time: '30 min ago' },
  { id: 2, type: 'info', patient: 'James Smith', message: 'Medication reminder sent', time: '1 hour ago' },
  { id: 3, type: 'success', patient: 'Mary Smith', message: 'Daily vitals recorded', time: '2 hours ago' },
];

const getAlertColor = (type: string) => {
  switch (type) {
    case 'warning':
      return 'border-l-warning bg-warning/5';
    case 'info':
      return 'border-l-info bg-info/5';
    case 'success':
      return 'border-l-success bg-success/5';
    default:
      return 'border-l-muted bg-muted/5';
  }
};

const FamilyDashboard = () => {
  const { user } = useAuthStore();
  const { incomingEmergency, activeEmergencyDetails, acceptEmergency, ignoreEmergency } = useSOSStore();

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

  useEffect(() => {
    if (incomingEmergency && activeEmergencyDetails && locationStatus === 'idle') {
      requestLocation();
    }
  }, [incomingEmergency, activeEmergencyDetails, locationStatus]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <SOSAlertBanner />
      <SOSEmergencyStatus />
      
      {/* Receiver Overlay */}
      <AnimatePresence>
      {incomingEmergency && activeEmergencyDetails && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[100] bg-red-600/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 md:p-6 text-center"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="max-w-5xl w-full bg-red-800/80 p-6 md:p-8 rounded-2xl border-4 border-red-400 shadow-2xl backdrop-blur-md"
          >
            <h1 className="text-3xl md:text-5xl font-black mb-2 uppercase tracking-widest text-red-50 drop-shadow-lg">Emergency SOS</h1>
            <p className="text-lg md:text-xl font-semibold mb-6 text-red-100">Immediate Response Required</p>
            
            <div className="flex flex-col md:flex-row gap-6 mb-2">
               {/* Left Column: Details & Actions */}
               <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="bg-black/20 p-5 rounded-xl text-left space-y-3 shadow-inner border border-white/10">
                    <p className="flex items-center gap-3 text-lg"><span className="opacity-70 w-20">Patient:</span> <span className="font-bold">{activeEmergencyDetails.patientName}</span></p>
                    <p className="flex items-center gap-3 text-lg"><span className="opacity-70 w-20">Location:</span> <span className="font-bold">{activeEmergencyDetails.location}</span></p>
                    <p className="flex items-center gap-3 text-lg"><span className="opacity-70 w-20">ID:</span> <span className="font-bold font-mono text-white/80">{activeEmergencyDetails.id}</span></p>
                  </div>

                  <div className="space-y-4 mt-auto">
                    {locationStatus !== 'granted' ? (
                        <div className="w-full bg-red-900 border-2 border-red-400 p-4 rounded-xl shadow-inner text-center">
                            <h3 className="text-xl font-bold flex items-center justify-center gap-2 text-white">
                                <MapPinOff className="w-5 h-5 text-red-300"/> Receiver Location Required
                            </h3>
                            <p className="mt-2 text-sm text-red-200">
                                You cannot accept an emergency without sharing your location to coordinate tracking.{locationStatus === 'denied' ? ' Check permissions.' : ''}
                            </p>
                            <button 
                                onClick={requestLocation} 
                                disabled={locationStatus === 'loading'}
                                className="mt-3 w-full py-3 rounded-xl bg-white text-red-800 font-bold uppercase transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                {locationStatus === 'loading' ? 'Requesting...' : 'Enable Location'}
                            </button>
                        </div>
                    ) : (
                        <button 
                          onClick={() => {
                            if (coords) {
                               const mapData = useSOSStore.getState().mapData;
                               useSOSStore.getState().setMapData({
                                   ...mapData,
                                   responder_location: coords
                               });
                            }
                            acceptEmergency();
                            useSOSStore.getState().setResponderInfo({ name: 'Family Member', status: 'En route' });
                          }}
                          className="w-full py-4 rounded-xl bg-white text-red-700 text-xl font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.7)] active:scale-95 animate-[pulse_2s_ease-in-out_infinite]"
                        >
                          Accept & Respond
                        </button>
                    )}
                    
                    <button 
                      onClick={ignoreEmergency}
                      className="w-full py-3 rounded-xl bg-black/30 hover:bg-black/40 text-white/90 font-bold uppercase transition-all shadow-md active:scale-95 border border-white/10"
                    >
                      Ignore (Escalate further)
                    </button>
                  </div>
               </div>

               {/* Right Column: Live Map */}
               <div className="flex-1 h-64 md:h-auto min-h-[300px] rounded-xl overflow-hidden border-2 border-red-400 shadow-inner bg-black/20 relative">
                    <AnimatedEmergencyMap 
                        patientLoc={{ lat: 37.7749, lng: -122.4194 }}
                        responderLoc={{ lat: 37.7649, lng: -122.4094 }}
                        isActive={true}
                    />
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <MainLayout>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Hello, {user?.full_name?.split(' ')[0]}!</h1>
              <p className="text-muted-foreground">Monitor your family's health in one place</p>
            </div>
            <Button variant="gradient" asChild>
              <Link to="/family/patients">
                <UserPlus className="w-4 h-4 mr-2" />
                Link Patient
              </Link>
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Linked Patients"
              value="2"
              icon={<Users className="w-6 h-6" />}
            />
            <StatCard
              title="Health Score"
              value="85%"
              subtitle="Average"
              icon={<Heart className="w-6 h-6" />}
              trend={{ value: 5, isPositive: true }}
            />
            <StatCard
              title="Alerts Today"
              value="3"
              icon={<Bell className="w-6 h-6" />}
            />
            <StatCard
              title="Prescriptions"
              value="8"
              subtitle="Active"
              icon={<FileText className="w-6 h-6" />}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Linked Patients */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Linked Patients
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/family/patients">Manage</Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockLinkedPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-semibold text-primary">
                          {patient.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{patient.name}</p>
                          <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                            {patient.relation}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.age} years • {patient.condition}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last update: {patient.lastUpdate}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-success/10 text-success capitalize">
                          {patient.status}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/family/patients`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Health Alerts */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                    >
                      <p className="text-sm font-medium">{alert.patient}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{alert.time}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'View Patients', href: '/family/patients', icon: Users },
                { label: 'Health Updates', href: '/family/health-updates', icon: Activity },
                { label: 'AI Symptom Check', href: '/ai/symptom-checker', icon: AlertCircle },
                { label: 'Health Trends', href: '/ai/health-prediction', icon: TrendingUp },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200 text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <action.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{action.label}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </MainLayout>
    </>
  );
};

export default FamilyDashboard;
