import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
export default function MainLayout() {
    console.log('MainLayout: Rendering layout with Outlet');
    useDocumentTitle();
    return (_jsxs(Box, { sx: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: 'background.default'
        }, children: [_jsx(Header, {}), _jsx(Box, { sx: {
                    flex: 1,
                    py: 4,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                }, children: _jsx(Container, { maxWidth: "xl", children: _jsx(Outlet, {}) }) }), _jsx(Footer, {})] }));
}
