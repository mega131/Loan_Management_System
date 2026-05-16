import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyLoans = createAsyncThunk('loans/fetchMyLoans', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/loans/my-loans', { params });
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch loans'); }
});

export const fetchAllLoans = createAsyncThunk('loans/fetchAllLoans', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/loans/all', { params });
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch all loans'); }
});

export const applyForLoan = createAsyncThunk('loans/applyForLoan', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/loans/apply', data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message || 'Failed to apply'); }
});

export const approveLoan = createAsyncThunk('loans/approveLoan', async ({ loanId, notes, interestRate }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/loans/${loanId}/approve`, { notes, interestRate });
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message || 'Failed to approve'); }
});

export const rejectLoan = createAsyncThunk('loans/rejectLoan', async ({ loanId, rejectionReason }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/loans/${loanId}/reject`, { rejectionReason });
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message || 'Failed to reject'); }
});

export const disburseLoan = createAsyncThunk('loans/disburseLoan', async ({ loanId }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/loans/${loanId}/disburse`, {});
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message || 'Failed to disburse'); }
});

export const fetchEMISchedule = createAsyncThunk('loans/fetchEMISchedule', async (loanId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/loans/${loanId}/emi-schedule`);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message); }
});

export const payEMI = createAsyncThunk('loans/payEMI', async ({ loanId, ...data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/loans/${loanId}/pay-emi`, data);
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message || 'Payment failed'); }
});

export const fetchPortfolio = createAsyncThunk('loans/fetchPortfolio', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/loans/reports/portfolio');
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message); }
});

export const fetchAllUsers = createAsyncThunk('loans/fetchAllUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/loans/admin/users');
    return res.data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.error?.message); }
});

const loanSlice = createSlice({
  name: 'loans',
  initialState: {
    myLoans: [], allLoans: [], users: [], portfolio: null,
    emiSchedule: null, selectedLoan: null,
    loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  },
  reducers: {
    clearLoanError(state) { state.error = null; },
    setSelectedLoan(state, action) { state.selectedLoan = action.payload; },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setError = (state, action) => { state.loading = false; state.error = action.payload; };
    builder
      .addCase(fetchMyLoans.pending, setLoading)
      .addCase(fetchMyLoans.fulfilled, (state, action) => { state.loading = false; state.myLoans = action.payload.loans; state.pagination = action.payload.pagination; })
      .addCase(fetchMyLoans.rejected, setError)
      .addCase(fetchAllLoans.pending, setLoading)
      .addCase(fetchAllLoans.fulfilled, (state, action) => { state.loading = false; state.allLoans = action.payload.loans; state.pagination = action.payload.pagination; })
      .addCase(fetchAllLoans.rejected, setError)
      .addCase(applyForLoan.pending, setLoading)
      .addCase(applyForLoan.fulfilled, (state, action) => { state.loading = false; state.myLoans.unshift(action.payload); })
      .addCase(applyForLoan.rejected, setError)
      .addCase(approveLoan.fulfilled, (state, action) => { const idx = state.allLoans.findIndex(l => l.id === action.payload.id); if (idx >= 0) state.allLoans[idx] = action.payload; })
      .addCase(rejectLoan.fulfilled, (state, action) => { const idx = state.allLoans.findIndex(l => l.id === action.payload.id); if (idx >= 0) state.allLoans[idx] = action.payload; })
      .addCase(disburseLoan.fulfilled, (state, action) => { const idx = state.allLoans.findIndex(l => l.id === action.payload.id); if (idx >= 0) state.allLoans[idx] = action.payload; })
      .addCase(fetchEMISchedule.fulfilled, (state, action) => { state.emiSchedule = action.payload; })
      .addCase(fetchPortfolio.fulfilled, (state, action) => { state.portfolio = action.payload; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => { state.users = action.payload; });
  },
});

export const { clearLoanError, setSelectedLoan } = loanSlice.actions;
export default loanSlice.reducer;
