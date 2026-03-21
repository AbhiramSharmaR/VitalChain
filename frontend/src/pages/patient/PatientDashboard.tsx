import { motion } from 'framer-motion';
import { getSimulatedHealthData } from "@/api/iot";
import {
  Activity,
  Calendar,
  FileText,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from "react";
import { StatCard } from '@/components/common/StatCard';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import SOSButton from '@/components/SOSButton';

const mockVitals = {
  heartRate: 72,
  bloodPressure: '120/80',
  temperature: 98.6,
  oxygenLevel: 98,
  respiratoryRate: 16,
};


const mockAppointments = [
  { id: 1, doctor: 'Dr. Sarah Johnson', specialty: 'Cardiologist', date: 'Dec 5, 2024', time: '10:00 AM' },
  { id: 2, doctor: 'Dr. Michael Chen', specialty: 'General Physician', date: 'Dec 8, 2024', time: '2:30 PM' },
];

const mockPrescriptions = [
  { id: 1, medication: 'Lisinopril 10mg', frequency: 'Once daily', status: 'Active' },
  { id: 2, medication: 'Metformin 500mg', frequency: 'Twice daily', status: 'Active' },
  { id: 3, medication: 'Aspirin 81mg', frequency: 'Once daily', status: 'Active' },
];

const PatientDashboard = () => {
  const { user } = useAuthStore();

  const [iotVitals, setIotVitals] = useState<any>(null);
  useEffect(() => {
  const interval = setInterval(() => {
    const data = getSimulatedHealthData();
    setIotVitals(data);
  }, 3000);

  return () => clearInterval(interval);
}, []);

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
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div style={{ color: "green", fontWeight: "bold" }}>
  ✅ Connected to Google Fit (Simulated)
        </div>
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Here's an overview of your health today</p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/ai/symptom-checker">Check Symptoms</Link>
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="flex items-center justify-center bg-red-50/50 border-red-200 shadow-sm transition-all hover:shadow-md h-[180px]">
            <SOSButton />
          </Card>

          <div className="grid col-span-2 lg:col-span-4 grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Heart Rate"
              value={`${vitals.heartRate} bpm`}
              icon={<Heart className="w-6 h-6" />}
              trend={{ value: 2, isPositive: true }}
            />
            <StatCard
              title="Blood Pressure"
              value={vitals.bloodPressure}
              subtitle="mmHg"
              icon={<Activity className="w-6 h-6" />}
            />
            <StatCard
              title="Temperature"
              value={`${vitals.temperature}°F`}
              icon={<Thermometer className="w-6 h-6" />}
            />
            <StatCard
              title="Oxygen Level"
              value={`${vitals.oxygenLevel}%`}
              icon={<Droplets className="w-6 h-6" />}
              trend={{ value: 1, isPositive: true }}
            />
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vitals Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Vitals Trend
                </CardTitle>
                <Button variant="ghost" size="sm">View Details</Button>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">Vitals chart will display here</p>
                    <p className="text-sm text-muted-foreground/70">Connect to IoT devices to see real-time data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Appointments */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Appointments
                </CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <p className="font-medium">{apt.doctor}</p>
                    <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-primary">
                      <Calendar className="w-3 h-3" />
                      {apt.date} at {apt.time}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Prescriptions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Active Prescriptions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patient/prescriptions">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {mockPrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <p className="font-medium">{rx.medication}</p>
                    <p className="text-sm text-muted-foreground">{rx.frequency}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-success/10 text-success mt-2">
                      {rx.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Symptom Check', href: '/ai/symptom-checker', icon: Activity },
              { label: 'AI Assistant', href: '/ai/chatbot', icon: Wind },
              { label: 'View Vitals', href: '/patient/vitals', icon: Heart },
              { label: 'Prescriptions', href: '/patient/prescriptions', icon: FileText },
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
  );
};

export default PatientDashboard;
