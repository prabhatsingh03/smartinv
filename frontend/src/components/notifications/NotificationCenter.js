import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Badge, IconButton, Menu, MenuItem, ListItemText } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
export default function NotificationCenter() {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleOpen = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);
    // Placeholder items
    const items = [
        { id: 1, message: 'Invoice #123 uploaded', is_read: false },
        { id: 2, message: 'Invoice #456 approved', is_read: true }
    ];
    const unread = items.filter((i) => !i.is_read).length;
    return (_jsxs(_Fragment, { children: [_jsx(IconButton, { color: "inherit", onClick: handleOpen, "aria-label": "notifications", children: _jsx(Badge, { badgeContent: unread, color: "error", children: _jsx(NotificationsIcon, {}) }) }), _jsxs(Menu, { anchorEl: anchorEl, open: open, onClose: handleClose, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, children: [items.map((n) => (_jsx(MenuItem, { onClick: handleClose, children: _jsx(ListItemText, { primary: n.message }) }, n.id))), items.length === 0 && _jsx(MenuItem, { disabled: true, children: "No notifications" })] })] }));
}
