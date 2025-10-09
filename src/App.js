import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FeedbackReview from './pages/FeedbackReview';
import NotificationManagement from './pages/NotificationManagement';
import AnalysisReport from './pages/AnalysisReport';
import MarkersManagement from './pages/MarkersManagement';
import ARManagement from './pages/ARManagement';
import ContentManagement from './pages/ContentManagement';
import FAQScreen from './pages/FAQScreen';
import TermsOfServiceScreen from './pages/TermsOfServicesScreen';
import PrivacyPolicyScreen from './pages/PrivacyPolicyScreen';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/faqs" element={<FAQScreen />} />
          <Route path="/terms" element={<TermsOfServiceScreen />} />
          <Route path="/privacy" element={<PrivacyPolicyScreen />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><FeedbackReview /></ProtectedRoute>} />
          <Route path="/notification-management" element={<ProtectedRoute><NotificationManagement /></ProtectedRoute>} />
          <Route path="/analysis-report" element={<ProtectedRoute><AnalysisReport /></ProtectedRoute>} />
          <Route path="/markers-management" element={<ProtectedRoute><MarkersManagement /></ProtectedRoute>} />
          <Route path="/ar-management" element={<ProtectedRoute><ARManagement /></ProtectedRoute>} />
          <Route path="/content-management" element={<ProtectedRoute><ContentManagement /></ProtectedRoute>} />
        

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
