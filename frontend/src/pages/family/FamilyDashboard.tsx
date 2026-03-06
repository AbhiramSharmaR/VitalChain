import { motion } from 'framer-motion';
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
