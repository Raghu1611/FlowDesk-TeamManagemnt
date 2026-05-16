import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProjectsAPI } from '../../api/project.api';

export const fetchProjects = createAsyncThunk('projects/fetchProjects', async (_, thunkAPI) => {
  try {
    const response = await getProjectsAPI();
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState: { projects: [], loading: false, error: null },
  reducers: {
    addProject: (state, action) => {
      if (!state.projects.find(p => p._id === action.payload._id)) {
        state.projects.unshift(action.payload);
      }
    },
    updateProject: (state, action) => {
      const index = state.projects.findIndex(p => p._id === action.payload._id);
      if (index !== -1) state.projects[index] = action.payload;
    },
    removeProject: (state, action) => {
      state.projects = state.projects.filter(p => p._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { addProject, updateProject, removeProject } = projectsSlice.actions;
export default projectsSlice.reducer;
