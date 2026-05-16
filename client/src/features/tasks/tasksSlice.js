import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getTasksAPI } from '../../api/task.api';

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (_, thunkAPI) => {
  try {
    const response = await getTasksAPI();
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
    addTask: (state, action) => {
      // Prevent duplicates from socket
      if (!state.tasks.find(t => t._id === action.payload._id)) {
        state.tasks.push(action.payload);
      }
    },
    updateTask: (state, action) => {
      const index = state.tasks.findIndex(t => t._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    removeTask: (state, action) => {
      state.tasks = state.tasks.filter(t => t._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setTasks, addTask, updateTask, removeTask } = tasksSlice.actions;
export default tasksSlice.reducer;
