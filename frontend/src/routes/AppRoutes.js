import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return _jsx(Navigate, { to: to, replace: true });
}
// Wrapper components for each route
function DashboardPage() {
    console.log('DashboardPage: Rendering AdminDashboard');
    return _jsx(AdminDashboard, {});
}
function HRPage() {
    console.log('HRPage: Rendering HRDashboard');
    return _jsx(HRDashboard, {});
}
function SitePage() {
    console.log('SitePage: Rendering SiteDashboard');
    return _jsx(SiteDashboard, {});
}
function ProcurementPage() {
    console.log('ProcurementPage: Rendering ProcurementDashboard');
    return _jsx(ProcurementDashboard, {});
}
function FinancePage() {
    console.log('FinancePage: Rendering FinanceDashboard');
    return _jsx(FinanceDashboard, {});
}
function FinancePendingPage() {
    console.log('FinancePendingPage: Rendering PendingInvoicesList');
    return _jsx(PendingInvoicesList, {});
}
function FinanceApprovedPage() {
    console.log('FinanceApprovedPage: Rendering ApprovedInvoicesList');
    return _jsx(ApprovedInvoicesList, {});
}
function SuperAdminPage() {
    console.log('SuperAdminPage: Rendering SuperAdminDashboard');
    return _jsx(SuperAdminDashboard, {});
}
function SuperAdminUsersPage() {
    console.log('SuperAdminUsersPage: Rendering UserManagement');
    return _jsx(UserManagement, {});
}
function SuperAdminAuditPage() {
    console.log('SuperAdminAuditPage: Rendering AuditTrail');
    return _jsx(AuditTrail, {});
}
function SuperAdminConfigPage() {
    console.log('SuperAdminConfigPage: Rendering SystemConfiguration');
    return _jsx(SystemConfiguration, {});
}
function SuperAdminReportsPage() {
    console.log('SuperAdminReportsPage: Rendering SystemReports');
    return _jsx(SystemReports, {});
}
function InvoicesPage() {
    console.log('InvoicesPage: Rendering InvoiceManagement');
    return _jsx(InvoiceManagement, {});
}
export default function AppRoutes() {
    console.log('AppRoutes: Rendering routes');
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginForm, {}) }), _jsxs(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(MainLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(RoleRedirect, {}) }), _jsx(Route, { path: "dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "hr", element: _jsx(HRPage, {}) }), _jsx(Route, { path: "site", element: _jsx(SitePage, {}) }), _jsx(Route, { path: "procurement", element: _jsx(ProcurementPage, {}) }), _jsx(Route, { path: "finance", element: _jsx(FinancePage, {}) }), _jsx(Route, { path: "finance/pending", element: _jsx(FinancePendingPage, {}) }), _jsx(Route, { path: "finance/approved", element: _jsx(FinanceApprovedPage, {}) }), _jsx(Route, { path: "finance/invoices/:id", element: _jsx(InvoiceReviewPage, {}) }), _jsx(Route, { path: "finance/invoices/:id/edit", element: _jsx(InvoiceReviewPage, {}) }), _jsx(Route, { path: "invoices/:id", element: _jsx(InvoiceReviewPage, {}) }), _jsx(Route, { path: "invoices/:id/edit", element: _jsx(InvoiceReviewPage, {}) }), _jsx(Route, { path: "superadmin", element: _jsx(SuperAdminPage, {}) }), _jsx(Route, { path: "superadmin/users", element: _jsx(SuperAdminUsersPage, {}) }), _jsx(Route, { path: "superadmin/audit", element: _jsx(SuperAdminAuditPage, {}) }), _jsx(Route, { path: "superadmin/config", element: _jsx(SuperAdminConfigPage, {}) }), _jsx(Route, { path: "superadmin/reports", element: _jsx(SuperAdminReportsPage, {}) }), _jsx(Route, { path: "invoices", element: _jsx(InvoicesPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
