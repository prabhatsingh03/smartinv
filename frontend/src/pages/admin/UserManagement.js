import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { fetchUsers, createUser, activateUser, deactivateUser, updateUser } from '@store/superAdminSlice';
import api from '@services/apiService';
export default function UserManagement() {
    const dispatch = useAppDispatch();
    const users = useAppSelector((s) => s.superAdmin.users);
    const loading = useAppSelector((s) => s.superAdmin.usersLoading);
    const [search, setSearch] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Admin');
    const [roles, setRoles] = useState([]);
    const [departmentId, setDepartmentId] = useState('');
    const [departments, setDepartments] = useState([]);
    const [editOpen, setEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [editEmail, setEditEmail] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editRole, setEditRole] = useState('Admin');
    const [editDepartmentId, setEditDepartmentId] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editPassword, setEditPassword] = useState('');
    useEffect(() => {
        dispatch(fetchUsers({ page: 1, per_page: 20 }));
        (async () => {
            try {
                const r1 = await api.get('/users/roles');
                setRoles(r1.data.roles || []);
            }
            catch { }
            try {
                const r2 = await api.get('/users/departments');
                setDepartments(r2.data.departments || []);
            }
            catch { }
        })();
    }, [dispatch]);
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "User Management" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { label: "Search", value: search, onChange: (e) => setSearch(e.target.value), size: "small" }), _jsx(Button, { variant: "contained", onClick: () => dispatch(fetchUsers({ search })), children: "Search" })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Create User" }), _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, children: [_jsx(TextField, { label: "Email", value: email, onChange: (e) => setEmail(e.target.value), size: "small" }), _jsx(TextField, { label: "Username", value: username, onChange: (e) => setUsername(e.target.value), size: "small" }), _jsx(TextField, { label: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), size: "small" }), _jsxs(FormControl, { size: "small", sx: { minWidth: 160 }, children: [_jsx(InputLabel, { id: "role-label", children: "Role" }), _jsx(Select, { labelId: "role-label", label: "Role", value: role, onChange: (e) => setRole(e.target.value), children: roles.map((r) => (_jsx(MenuItem, { value: r, children: r }, r))) })] }), _jsxs(FormControl, { size: "small", sx: { minWidth: 180 }, children: [_jsx(InputLabel, { id: "dept-label", children: "Department" }), _jsxs(Select, { labelId: "dept-label", label: "Department", value: departmentId, onChange: (e) => setDepartmentId(e.target.value), displayEmpty: true, children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "None" }) }), departments.map((d) => (_jsx(MenuItem, { value: d.id, children: d.name }, d.id)))] })] }), _jsx(Button, { variant: "contained", onClick: () => dispatch(createUser({ email, username, password, role, department_id: departmentId || undefined }))
                                        .unwrap()
                                        .then(() => {
                                        setEmail('');
                                        setUsername('');
                                        setPassword('');
                                        setRole('Admin');
                                        setDepartmentId('');
                                        dispatch(fetchUsers({ page: 1, per_page: 20 }));
                                    }), disabled: !email || !username || !password, children: "Create" })] })] }) }), loading ? (_jsx(CircularProgress, {})) : (_jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "ID" }), _jsx(TableCell, { children: "Username" }), _jsx(TableCell, { children: "Email" }), _jsx(TableCell, { children: "Role" }), _jsx(TableCell, { children: "Active" }), _jsx(TableCell, { children: "Actions" })] }) }), _jsx(TableBody, { children: users?.items.map((u) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: u.id }), _jsx(TableCell, { children: u.username }), _jsx(TableCell, { children: u.email }), _jsx(TableCell, { children: u.role }), _jsx(TableCell, { children: u.is_active ? 'Yes' : 'No' }), _jsxs(TableCell, { children: [_jsx(Button, { size: "small", onClick: () => {
                                                        setEditUserId(u.id);
                                                        setEditEmail(u.email || '');
                                                        setEditUsername(u.username || '');
                                                        setEditRole(u.role || 'Admin');
                                                        setEditDepartmentId(u.department_id ?? '');
                                                        setEditIsActive(!!u.is_active);
                                                        setEditPassword('');
                                                        setEditOpen(true);
                                                    }, children: "Edit" }), u.is_active ? (_jsx(Button, { size: "small", onClick: () => dispatch(deactivateUser(u.id)).unwrap().then(() => dispatch(fetchUsers({ page: 1, per_page: 20 }))), children: "Deactivate" })) : (_jsx(Button, { size: "small", onClick: () => dispatch(activateUser(u.id)).unwrap().then(() => dispatch(fetchUsers({ page: 1, per_page: 20 }))), children: "Activate" }))] })] }, u.id))) })] }) }) })), _jsxs(Dialog, { open: editOpen, onClose: () => setEditOpen(false), fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: "Edit User" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Email", value: editEmail, onChange: (e) => setEditEmail(e.target.value), size: "small" }), _jsx(TextField, { label: "Username", value: editUsername, onChange: (e) => setEditUsername(e.target.value), size: "small" }), _jsxs(FormControl, { size: "small", sx: { minWidth: 160 }, children: [_jsx(InputLabel, { id: "edit-role-label", children: "Role" }), _jsx(Select, { labelId: "edit-role-label", label: "Role", value: editRole, onChange: (e) => setEditRole(e.target.value), children: roles.map((r) => (_jsx(MenuItem, { value: r, children: r }, r))) })] }), _jsxs(FormControl, { size: "small", sx: { minWidth: 180 }, children: [_jsx(InputLabel, { id: "edit-dept-label", children: "Department" }), _jsxs(Select, { labelId: "edit-dept-label", label: "Department", value: editDepartmentId, onChange: (e) => setEditDepartmentId(e.target.value), displayEmpty: true, children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "None" }) }), departments.map((d) => (_jsx(MenuItem, { value: d.id, children: d.name }, d.id)))] })] }), _jsx(TextField, { label: "New Password (optional)", type: "password", value: editPassword, onChange: (e) => setEditPassword(e.target.value), size: "small" })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditOpen(false), children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => {
                                    if (!editUserId)
                                        return;
                                    const payload = {
                                        email: editEmail,
                                        username: editUsername,
                                        role: editRole,
                                        department_id: editDepartmentId || null,
                                        is_active: editIsActive
                                    };
                                    if (editPassword)
                                        payload.password = editPassword;
                                    dispatch(updateUser({ id: editUserId, payload })).unwrap().then(() => {
                                        setEditOpen(false);
                                        dispatch(fetchUsers({ page: 1, per_page: 20 }));
                                    });
                                }, children: "Save" })] })] })] }));
}
