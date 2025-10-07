import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Container, Stack } from '@mui/material';
export default function Footer() {
    return (_jsx(Box, { component: "footer", sx: {
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'grey.200'
        }, children: _jsx(Container, { maxWidth: "xl", children: _jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "center", spacing: 2, children: [_jsx("img", { src: "https://www.simonindia.com/assets/images/logo.png", alt: "Simon India", style: {
                            height: '24px',
                            width: 'auto',
                            objectFit: 'contain'
                        } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u00A9 2024 SmartInv - Invoice Management System" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u2022" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Powered by Simon India" })] }) }) }));
}
