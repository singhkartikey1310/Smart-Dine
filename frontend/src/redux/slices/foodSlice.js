import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchFoods = createAsyncThunk('food/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/foods', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchFood = createAsyncThunk('food/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/foods/${id}`);
    return data.food;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchPopularFoods = createAsyncThunk('food/popular', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/foods/popular');
    return data.foods;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchFoodsByRestaurant = createAsyncThunk('food/byRestaurant', async (restaurantId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/foods/restaurant/${restaurantId}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const foodSlice = createSlice({
  name: 'food',
  initialState: {
    foods: [],
    popular: [],
    restaurantFoods: [],
    grouped: {},
    current: null,
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoods.pending, (state) => { state.loading = true; })
      .addCase(fetchFoods.fulfilled, (state, action) => {
        state.loading = false;
        state.foods = action.payload.foods;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchFoods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFood.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchPopularFoods.fulfilled, (state, action) => {
        state.popular = action.payload;
      })
      .addCase(fetchFoodsByRestaurant.fulfilled, (state, action) => {
        state.restaurantFoods = action.payload.foods;
        state.grouped = action.payload.grouped;
      });
  },
});

export default foodSlice.reducer;
