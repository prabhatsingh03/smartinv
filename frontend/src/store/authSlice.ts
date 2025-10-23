import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi, logout as logoutApi, getCurrentUser, isAuthenticated, User } from '@services/authService';

type AuthState = {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: getCurrentUser(),
  authenticated: isAuthenticated(),
  loading: false,
  error: null
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }) => {
    const response = await loginApi(payload.email, payload.password);
    return response.user;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await logoutApi();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.authenticated = !!action.payload;
    },
    clearUser(state) {
      state.user = null;
      state.authenticated = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.authenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.authenticated = false;
      });
  }
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;


