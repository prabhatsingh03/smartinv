import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi, logout as logoutApi } from '@services/authService';

type AuthState = {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  loading: false,
  error: null
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }) => {
    const tokens = await loginApi(payload.email, payload.password);
    return tokens.access_token;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await Promise.resolve();
  logoutApi();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.accessToken = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.accessToken = null;
      });
  }
});

export default authSlice.reducer;


