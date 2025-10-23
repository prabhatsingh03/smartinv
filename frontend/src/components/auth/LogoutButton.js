import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { Logout } from '@mui/icons-material';
export default function LogoutButton() {
    const navigate = useNavigate();
    const onLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login', { replace: true });
    };
    return (_jsx(Tooltip, { title: "Sign Out", children: _jsx(IconButton, { onClick: onLogout, sx: {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
            }, children: _jsx(Logout, {}) }) }));
}
