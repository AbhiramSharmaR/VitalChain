import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";
import PatientVitals from "./pages/patient/PatientVitals";



// Family Pages
import FamilyDashboard from "./pages/family/FamilyDashboard";
import FamilyPatients from "./pages/family/FamilyPatients";
import HealthUpdates from "./pages/family/HealthUpdates";

// AI Pages
import SymptomChecker from "./pages/ai/SymptomChecker";
import AIChatbot from "./pages/ai/AIChatbot";
import AnomalyDetector from "./pages/ai/AnomalyDetector";
import HealthPrediction from "./pages/ai/HealthPrediction";

// Components
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SOSPage from "./pages/SOSPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { token, user, isAuthenticated, setLoading, setUser, logout } = useAuthStore();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    // Rehydrate user from `/auth/me` if we have a token but no in-memory user.
    if (isAuthenticated && token && !user) {
      setLoading(true);
      authApi
        .getCurrentUser()
        .then((u) => setUser(u))
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, token, user, setUser, logout, setLoading]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Patient Routes */}
      <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/prescriptions" element={<ProtectedRoute allowedRoles={['patient']}><PatientPrescriptions /></ProtectedRoute>} />
      <Route path="/patient/vitals" element={<ProtectedRoute allowedRoles={['patient']}><PatientVitals /></ProtectedRoute>} />



      {/* Family Routes */}
      <Route path="/family/dashboard" element={<ProtectedRoute allowedRoles={['family']}><FamilyDashboard /></ProtectedRoute>} />
      <Route path="/family/patients" element={<ProtectedRoute allowedRoles={['family']}><FamilyPatients /></ProtectedRoute>} />
      <Route path="/family/health-updates" element={<ProtectedRoute allowedRoles={['family']}><HealthUpdates /></ProtectedRoute>} />

      {/* AI Routes (accessible by all authenticated users) */}
      <Route path="/ai/symptom-checker" element={<ProtectedRoute><SymptomChecker /></ProtectedRoute>} />
      <Route path="/ai/chatbot" element={<ProtectedRoute><AIChatbot /></ProtectedRoute>} />
      <Route path="/ai/anomaly-detector" element={<ProtectedRoute><AnomalyDetector /></ProtectedRoute>} />
      <Route path="/ai/health-prediction" element={<ProtectedRoute><HealthPrediction /></ProtectedRoute>} />

      {/* SOS Route */}
      <Route path="/sos" element={<ProtectedRoute><SOSPage /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
