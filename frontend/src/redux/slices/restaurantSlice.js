import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchRestaurants = createAsyncThunk('restaurant/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/restaurants', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchRestaurant = createAsyncThunk('restaurant/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/restaurants/${id}`);
    return data.restaurant;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchFeaturedRestaurants = createAsyncThunk('restaurant/featured', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/restaurants/featured');
    return data.restaurants;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMyRestaurant = createAsyncThunk('restaurant/my', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/restaurants/my');
    return data.restaurant;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: {
    restaurants: [],
    featured: [],
    current: null,
    myRestaurant: null,
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => { state.loading = true; })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload.restaurants;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRestaurant.pending, (state) => { state.loading = true; })
      .addCase(fetchRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFeaturedRestaurants.fulfilled, (state, action) => {
        state.featured = action.payload;
      })
      .addCase(fetchMyRestaurant.fulfilled, (state, action) => {
        state.myRestaurant = action.payload;
      });
  },
});

export const { clearCurrent } = restaurantSlice.actions;
export default restaurantSlice.reducer;
