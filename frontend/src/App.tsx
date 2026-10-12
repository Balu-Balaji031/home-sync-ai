
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';

// Pages
import Login from './features/auth/pages/Login';
import AccountTypeSelection from './features/auth/pages/AccountTypeSelection';
import Registration from './features/auth/pages/Registration';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import VerifyEmail from './features/auth/pages/VerifyEmail';
import AdminRegistration from './features/auth/pages/AdminRegistration';

import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './features/customer/layouts/CustomerLayout';
import CustomerDashboard from './features/customer/pages/CustomerDashboard';
import MyDevices from './features/customer/pages/MyDevices';
import AIAssistant from './features/ai-assistant/pages/AIAssistant.tsx';
import AIChat from './features/ai-assistant/pages/AIChat.tsx';
import AIHistory from './features/customer/pages/AIHistory';
import CustomerProfile from './features/customer/pages/CustomerProfile';
import CustomerSettings from './features/customer/pages/CustomerSettings';
import MyTickets from './features/customer/pages/MyTickets';
import Notifications from './features/customer/pages/Notifications';
import TechnicianLayout from './features/technician/layouts/TechnicianLayout';
import TechnicianFoundationPage from './features/technician/pages/TechnicianFoundationPage';
import TechnicianDashboard from './features/technician/pages/TechnicianDashboard';
import TechnicianAssessment from './features/technician/pages/TechnicianAssessment';
import TechnicianTickets from './features/technician/pages/TechnicianTickets';
import TechnicianTicketDetails from './features/technician/pages/TechnicianTicketDetails';
import TechnicianTicketsHistory from './features/technician/pages/TechnicianTicketsHistory';
import TechnicianSettings from './features/technician/pages/TechnicianSettings';
import AdminLayout from './features/admin/layouts/AdminLayout';
import AdminPlaceholder from './features/admin/pages/AdminPlaceholder';
import AdminApplications from './features/admin/pages/AdminApplications';
import AdminAssessments from './features/admin/pages/AdminAssessments';
import AdminFinalApprovals from './features/admin/pages/AdminFinalApprovals';
import AdminApprovedTechnicians from './features/admin/pages/AdminApprovedTechnicians';
import AdminCustomers from './features/admin/pages/AdminCustomers';
import AdminSettings from './features/admin/pages/AdminSettings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AccountTypeSelection />} />
          <Route path="/register/customer" element={<Registration />} />
          <Route path="/register/technician" element={<Registration />} />
          <Route path="/register/admin" element={<AdminRegistration />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Customer Portal */}
          <Route element={<ProtectedRoute allowedRole="customer" />}>
            <Route path="/customer" element={<CustomerLayout />}>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="devices" element={<MyDevices />} />
              <Route path="ai-assistant" element={<AIAssistant />} />
              <Route path="ai-assistant/:sessionId" element={<AIChat />} />
              <Route path="ai-history" element={<AIHistory />} />
              <Route path="ai-history/:sessionId" element={<AIHistory />} />
              <Route path="profile" element={<CustomerProfile />} />
              <Route path="settings" element={<CustomerSettings />} />
              <Route path="tickets" element={<MyTickets />} />
              <Route path="tickets/:ticketId" element={<MyTickets />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* Technician Portal foundation */}
          <Route element={<ProtectedRoute allowedRole="technician" />}>
            <Route path="/technician" element={<TechnicianLayout />}>
              <Route path="dashboard" element={<TechnicianDashboard />} />
              <Route path="assessment" element={<TechnicianAssessment />} />
              <Route path="tickets" element={<TechnicianTickets />} />
              <Route path="tickets/:ticketId" element={<TechnicianTicketDetails />} />
              <Route path="tickets-history" element={<TechnicianTicketsHistory />} />
              <Route path="profile" element={<TechnicianFoundationPage />} />
              <Route path="settings" element={<TechnicianSettings />} />
            </Route>
          </Route>

          {/* Admin Portal foundation */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminPlaceholder />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="assessments" element={<AdminAssessments />} />
              <Route path="final-approvals" element={<AdminFinalApprovals />} />
              <Route path="approved-technicians" element={<AdminApprovedTechnicians />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
