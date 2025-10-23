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
  const [roles, setRoles] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('Admin');
  const [editDepartmentId, setEditDepartmentId] = useState<number | ''>('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, per_page: 20 }));
    (async () => {
      try {
        const r1 = await api.get('/users/roles');
        setRoles(r1.data.roles || []);
      } catch {}
      try {
        const r2 = await api.get('/users/departments');
        setDepartments(r2.data.departments || []);
      } catch {}
    })();
  }, [dispatch]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">User Management</Typography>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2}>
            <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} size="small" />
            <Button variant="contained" onClick={() => dispatch(fetchUsers({ search }))}>Search</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Create User</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} size="small" />
            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} size="small" />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} size="small" />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select labelId="role-label" label="Role" value={role} onChange={(e) => setRole(e.target.value as string)}>
                {roles.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="dept-label">Department</InputLabel>
              <Select labelId="dept-label" label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value as number | '')} displayEmpty>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() =>
                dispatch(createUser({ email, username, password, role, department_id: departmentId || undefined }))
                  .unwrap()
                  .then(() => {
                    setEmail('');
                    setUsername('');
                    setPassword('');
                    setRole('Admin');
                    setDepartmentId('');
                    dispatch(fetchUsers({ page: 1, per_page: 20 }));
                  })
              }
              disabled={!email || !username || !password}
            >
              Create
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <CircularProgress />
      ) : (
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users?.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => {
                        setEditUserId(u.id);
                        setEditEmail(u.email || '');
                        setEditUsername(u.username || '');
                        setEditRole(u.role || 'Admin');
                        setEditDepartmentId((u as any).department_id ?? '');
                        setEditIsActive(!!u.is_active);
                        setEditPassword('');
                        setEditOpen(true);
                      }}>Edit</Button>
                      {u.is_active ? (
                        <Button size="small" onClick={() => dispatch(deactivateUser(u.id)).unwrap().then(() => dispatch(fetchUsers({ page: 1, per_page: 20 })))}>Deactivate</Button>
                      ) : (
                        <Button size="small" onClick={() => dispatch(activateUser(u.id)).unwrap().then(() => dispatch(fetchUsers({ page: 1, per_page: 20 })))}>Activate</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} size="small" />
            <TextField label="Username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} size="small" />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="edit-role-label">Role</InputLabel>
              <Select labelId="edit-role-label" label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value as string)}>
                {roles.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="edit-dept-label">Department</InputLabel>
              <Select labelId="edit-dept-label" label="Department" value={editDepartmentId} onChange={(e) => setEditDepartmentId(e.target.value as number | '')} displayEmpty>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="New Password (optional)" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            if (!editUserId) return;
            const payload: any = {
              email: editEmail,
              username: editUsername,
              role: editRole,
              department_id: editDepartmentId || null,
              is_active: editIsActive
            };
            if (editPassword) payload.password = editPassword;
            dispatch(updateUser({ id: editUserId, payload })).unwrap().then(() => {
              setEditOpen(false);
              dispatch(fetchUsers({ page: 1, per_page: 20 }));
            });
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}


