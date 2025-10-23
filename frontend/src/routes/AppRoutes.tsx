import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import HRDashboard from '../pages/dashboards/HRDashboard';
import SiteDashboard from '../pages/dashboards/SiteDashboard';
import ProcurementDashboard from '../pages/dashboards/ProcurementDashboard';
import FinanceDashboard from '../pages/dashboards/FinanceDashboard';
import InvoiceReviewPage from '../pages/finance/InvoiceReview';
import PendingInvoicesList from '../components/finance/PendingInvoicesList';
import ApprovedInvoicesList from '../components/finance/ApprovedInvoicesList';
import SuperAdminDashboard from '../pages/dashboards/SuperAdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import AuditTrail from '../pages/admin/AuditTrail';
import SystemConfiguration from '../pages/admin/SystemConfiguration';
import SystemReports from '../pages/admin/SystemReports';
import InvoiceManagement from '../pages/invoices/InvoiceManagement';
import LoginForm from '../components/auth/LoginForm';
import { useAppSelector } from '../hooks';
import { getCurrentUserRole } from '../utils/auth';

function RoleRedirect() {
  const { authenticated } = useAppSelector((s) => s.auth);
  const role = getCurrentUserRole();
  let to = '/dashboard';
  switch (role) {
    case 'HR':
      to = '/hr';
      break;
    case 'SITE':
      to = '/site';
      break;
    case 'PROCUREMENT':
      to = '/procurement';
      break;
    case 'FINANCE':
      to = '/finance';
      break;
    case 'SUPER_ADMIN':
      to = '/superadmin';
      break;
    case 'ADMIN':
    default:
      to = '/dashboard';
  }
  console.log('RoleRedirect: Redirecting to', to, 'for role', role);
  return <Navigate to={to} replace />;
}

// Wrapper components for each route
function DashboardPage() {
  console.log('DashboardPage: Rendering AdminDashboard');
  return <AdminDashboard />;
}

function HRPage() {
  console.log('HRPage: Rendering HRDashboard');
  return <HRDashboard />;
}

function SitePage() {
  console.log('SitePage: Rendering SiteDashboard');
  return <SiteDashboard />;
}

function ProcurementPage() {
  console.log('ProcurementPage: Rendering ProcurementDashboard');
  return <ProcurementDashboard />;
}

function FinancePage() {
  console.log('FinancePage: Rendering FinanceDashboard');
  return <FinanceDashboard />;
}

function FinancePendingPage() {
  console.log('FinancePendingPage: Rendering PendingInvoicesList');
  return <PendingInvoicesList />;
}

function FinanceApprovedPage() {
  console.log('FinanceApprovedPage: Rendering ApprovedInvoicesList');
  return <ApprovedInvoicesList />;
}

function SuperAdminPage() {
  console.log('SuperAdminPage: Rendering SuperAdminDashboard');
  return <SuperAdminDashboard />;
}

function SuperAdminUsersPage() {
  console.log('SuperAdminUsersPage: Rendering UserManagement');
  return <UserManagement />;
}

function SuperAdminAuditPage() {
  console.log('SuperAdminAuditPage: Rendering AuditTrail');
  return <AuditTrail />;
}

function SuperAdminConfigPage() {
  console.log('SuperAdminConfigPage: Rendering SystemConfiguration');
  return <SystemConfiguration />;
}

function SuperAdminReportsPage() {
  console.log('SuperAdminReportsPage: Rendering SystemReports');
  return <SystemReports />;
}

function InvoicesPage() {
  console.log('InvoicesPage: Rendering InvoiceManagement');
  return <InvoiceManagement />;
}

export default function AppRoutes() {
  console.log('AppRoutes: Rendering routes');
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="hr" element={<HRPage />} />
        <Route path="site" element={<SitePage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="finance/pending" element={<FinancePendingPage />} />
        <Route path="finance/approved" element={<FinanceApprovedPage />} />
        <Route path="finance/invoices/:id" element={<InvoiceReviewPage />} />
        <Route path="finance/invoices/:id/edit" element={<InvoiceReviewPage />} />
        {/* Generic invoice review routes for non-finance users */}
        <Route path="invoices/:id" element={<InvoiceReviewPage />} />
        <Route path="invoices/:id/edit" element={<InvoiceReviewPage />} />
        <Route path="superadmin" element={<SuperAdminPage />} />
        <Route path="superadmin/users" element={<SuperAdminUsersPage />} />
        <Route path="superadmin/audit" element={<SuperAdminAuditPage />} />
        <Route path="superadmin/config" element={<SuperAdminConfigPage />} />
        <Route path="superadmin/reports" element={<SuperAdminReportsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


