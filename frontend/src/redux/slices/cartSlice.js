import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ foodId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/add', { foodId, quantity });
    toast.success('Added to cart!');
    return data.cart;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add to cart');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ foodId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/cart/update', { foodId, quantity });
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (foodId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/cart/remove/${foodId}`);
    toast.success('Item removed');
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart/clear');
    return null;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const applyCoupon = createAsyncThunk('cart/coupon', async (code, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/coupon', { code });
    toast.success(data.message);
    return data.cart;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Invalid coupon');
    return rejectWithValue(err.response?.data?.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    restaurant: null,
    subtotal: 0,
    tax: 0,
    total: 0,
    discount: 0,
    couponCode: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.restaurant = null;
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.discount = 0;
      state.couponCode = null;
    },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      const cart = action.payload;
      if (cart) {
        state.items = cart.items || [];
        state.restaurant = cart.restaurant;
        state.subtotal = cart.subtotal || 0;
        state.tax = cart.tax || 0;
        state.total = cart.total || 0;
        state.discount = cart.discount || 0;
        state.couponCode = cart.couponCode;
      } else {
        state.items = [];
        state.restaurant = null;
        state.subtotal = 0;
        state.tax = 0;
        state.total = 0;
        state.discount = 0;
        state.couponCode = null;
      }
      state.loading = false;
    };

    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, (state) => { state.loading = false; })
      .addCase(addToCart.pending, (state) => { state.loading = true; })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(addToCart.rejected, (state) => { state.loading = false; })
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.restaurant = null;
        state.subtotal = 0;
        state.tax = 0;
        state.total = 0;
        state.discount = 0;
        state.couponCode = null;
      })
      .addCase(applyCoupon.fulfilled, setCart);
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
