import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getNotificationsAPI } from '../../api/notification.api';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, thunkAPI) => {
  try {
    const response = await getNotificationsAPI();
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { notifications: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    decrementUnread: (state) => {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
      state.notifications = state.notifications.map(n => ({ ...n, read: true }));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; });
  }
});

export const { addNotification, decrementUnread, clearUnread } = notificationsSlice.actions;
export default notificationsSlice.reducer;
