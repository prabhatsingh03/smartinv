import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SystemStatistics, AuditLog, AuditStatistics, PagedResult, User } from '@types';
import {
  getSystemStatistics,
  getAuditLogs,
  getAuditStats,
  getComprehensiveReport,
  listUsers,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deactivateUser as apiDeactivateUser,
  activateUser as apiActivateUser
} from '@services/apiService';

type State = {
  statistics?: SystemStatistics;
  statisticsLoading: boolean;
  statisticsError?: string;

  recentActivity: AuditLog[];
  dashboardActivity: AuditLog[];
  auditLogs: AuditLog[];
  dashboardActivityLoading?: boolean;
  auditLoading: boolean;
  auditError?: string;
  auditStats?: AuditStatistics;

  users?: PagedResult<User>;
  usersLoading: boolean;
  usersError?: string;

  report?: any;
  reportLoading: boolean;
  reportError?: string;
};

const initialState: State = {
  statisticsLoading: false,
  recentActivity: [],
  dashboardActivity: [],
  auditLogs: [],
  auditLoading: false,
  usersLoading: false,
  reportLoading: false
};

export const fetchSystemStatistics = createAsyncThunk('superAdmin/fetchSystemStatistics', async () => {
  return await getSystemStatistics();
});

export const fetchAuditLogs = createAsyncThunk('superAdmin/fetchAuditLogs', async (params: Parameters<typeof getAuditLogs>[0]) => {
  return await getAuditLogs(params);
});

export const fetchAuditStatistics = createAsyncThunk('superAdmin/fetchAuditStatistics', async () => {
  return await getAuditStats();
});

export const fetchUsers = createAsyncThunk('superAdmin/fetchUsers', async (params: Parameters<typeof listUsers>[0]) => {
  return await listUsers(params);
});

export const createUser = createAsyncThunk('superAdmin/createUser', async (payload: Parameters<typeof apiCreateUser>[0]) => {
  return await apiCreateUser(payload);
});

export const updateUser = createAsyncThunk('superAdmin/updateUser', async ({ id, payload }: { id: number; payload: Parameters<typeof apiUpdateUser>[1] }) => {
  return await apiUpdateUser(id, payload);
});

export const deactivateUser = createAsyncThunk('superAdmin/deactivateUser', async (id: number) => {
  return await apiDeactivateUser(id);
});

export const activateUser = createAsyncThunk('superAdmin/activateUser', async (id: number) => {
  return await apiActivateUser(id);
});

export const fetchComprehensiveReport = createAsyncThunk('superAdmin/fetchComprehensiveReport', async () => {
  return await getComprehensiveReport();
});

const slice = createSlice({
  name: 'superAdmin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Statistics
      .addCase(fetchSystemStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = undefined;
      })
      .addCase(fetchSystemStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = action.payload;
        state.dashboardActivity = action.payload.recent_activity || [];
      })
      .addCase(fetchSystemStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError = action.error.message;
      })
      // Audit logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.auditLoading = true;
        state.auditError = undefined;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.auditLoading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.auditLoading = false;
        state.auditError = action.error.message;
      })
      .addCase(fetchAuditStatistics.fulfilled, (state, action) => {
        state.auditStats = action.payload;
      })
      // Users
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = undefined;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      // User mutations
      .addCase(createUser.fulfilled, (state) => {})
      .addCase(activateUser.fulfilled, (state) => {})
      .addCase(deactivateUser.fulfilled, (state) => {})
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.error.message;
      })
      // Report
      .addCase(fetchComprehensiveReport.pending, (state) => {
        state.reportLoading = true;
        state.reportError = undefined;
      })
      .addCase(fetchComprehensiveReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.report = action.payload;
      })
      .addCase(fetchComprehensiveReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.reportError = action.error.message;
      });
  }
});

export default slice.reducer;


