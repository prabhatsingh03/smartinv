import { useState } from 'react';
import { Badge, IconButton, Menu, MenuItem, ListItemText } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Placeholder items
  const items = [
    { id: 1, message: 'Invoice #123 uploaded', is_read: false },
    { id: 2, message: 'Invoice #456 approved', is_read: true }
  ];

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="notifications">
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {items.map((n) => (
          <MenuItem key={n.id} onClick={handleClose}>
            <ListItemText primary={n.message} />
          </MenuItem>
        ))}
        {items.length === 0 && <MenuItem disabled>No notifications</MenuItem>}
      </Menu>
    </>
  );
}


