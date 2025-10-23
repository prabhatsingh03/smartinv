import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export function useDocumentTitle() {
    const location = useLocation();
    useEffect(() => {
        const path = location.pathname;
        let title = 'SmartInv - Simon India';
        // Set page-specific titles
        if (path === '/login') {
            title = 'Login - SmartInv - Simon India';
        }
        else if (path.startsWith('/dashboard')) {
            title = 'Admin Dashboard - SmartInv - Simon India';
        }
        else if (path.startsWith('/hr')) {
            title = 'HR Dashboard - SmartInv - Simon India';
        }
        else if (path.startsWith('/site')) {
            title = 'Site Dashboard - SmartInv - Simon India';
        }
        else if (path.startsWith('/procurement')) {
            title = 'Procurement Dashboard - SmartInv - Simon India';
        }
        else if (path.startsWith('/finance')) {
            if (path.includes('/pending')) {
                title = 'Pending Invoices - SmartInv - Simon India';
            }
            else if (path.includes('/approved')) {
                title = 'Approved Invoices - SmartInv - Simon India';
            }
            else if (path.includes('/invoices/')) {
                title = 'Invoice Review - SmartInv - Simon India';
            }
            else {
                title = 'Finance Dashboard - SmartInv - Simon India';
            }
        }
        else if (path.startsWith('/superadmin')) {
            if (path.includes('/users')) {
                title = 'User Management - SmartInv - Simon India';
            }
            else if (path.includes('/audit')) {
                title = 'Audit Trail - SmartInv - Simon India';
            }
            else if (path.includes('/config')) {
                title = 'System Configuration - SmartInv - Simon India';
            }
            else if (path.includes('/reports')) {
                title = 'System Reports - SmartInv - Simon India';
            }
            else {
                title = 'Super Admin Dashboard - SmartInv - Simon India';
            }
        }
        else if (path.startsWith('/invoices')) {
            if (path.includes('/edit')) {
                title = 'Edit Invoice - SmartInv - Simon India';
            }
            else {
                title = 'Invoice Management - SmartInv - Simon India';
            }
        }
        document.title = title;
    }, [location.pathname]);
}
