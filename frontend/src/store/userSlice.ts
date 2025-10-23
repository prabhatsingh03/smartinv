import { createSlice } from '@reduxjs/toolkit';
import type { User } from '@types';

type UserState = {
  users: User[];
};

const initialState: UserState = {
  users: []
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {}
});

export default userSlice.reducer;


