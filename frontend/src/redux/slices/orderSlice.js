import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const placeOrder = createAsyncThunk('order/place', async (orderData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', orderData);
    // ⚠️ No success toast here — shown after payment is confirmed
    return data.order;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to place order');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMyOrders = createAsyncThunk('order/myOrders', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders/my-orders', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchOrder = createAsyncThunk('order/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data.order;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const cancelOrder = createAsyncThunk('order/cancel', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/orders/${id}/cancel`, { reason });
    toast.success('Order cancelled');
    return data.order;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Cannot cancel order');
    return rejectWithValue(err.response?.data?.message);
  }
});

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    current: null,
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    placing: false,
    error: null,
  },
  reducers: {
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      if (state.current?._id === orderId) {
        state.current.status = status;
      }
      const order = state.orders.find((o) => o._id === orderId);
      if (order) order.status = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => { state.placing = true; })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placing = false;
        state.current = action.payload;
      })
      .addCase(placeOrder.rejected, (state) => { state.placing = false; })
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchMyOrders.rejected, (state) => { state.loading = false; })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.current = action.payload;
        const idx = state.orders.findIndex((o) => o._id === action.payload._id);
        if (idx > -1) state.orders[idx] = action.payload;
      });
  },
});

export const { updateOrderStatus } = orderSlice.actions;
export default orderSlice.reducer;
