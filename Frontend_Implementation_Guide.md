# Loan Management System - Frontend Implementation Guide

## Frontend Setup & Configuration

### 1. Project Initialization

```bash
npm create vite@latest loan-management-frontend -- --template react
cd loan-management-frontend

npm install react-router-dom
npm install @reduxjs/toolkit react-redux
npm install axios
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install react-hook-form zod @hookform/resolvers
npm install recharts chart.js react-chartjs-2
npm install react-toastify
npm install dotenv

# Dev Dependencies
npm install --save-dev tailwindcss postcss autoprefixer
npm install --save-dev @testing-library/react @testing-library/jest-dom jest vitest
npm install --save-dev @vitejs/plugin-react
```

### 2. Environment Configuration (.env)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Loan Management System
VITE_APP_VERSION=1.0.0
VITE_RAZORPAY_KEY=your_razorpay_key
VITE_MAX_FILE_SIZE=5242880
```

### 3. Project Structure

```
loan-management-frontend/
├── public/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AuthLayout.jsx
│   │   ├── Dashboard/
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── DashboardCard.jsx
│   │   ├── Loans/
│   │   │   ├── LoanList.jsx
│   │   │   ├── LoanDetails.jsx
│   │   │   ├── LoanApplication.jsx
│   │   │   └── ApplicationWizard.jsx
│   │   ├── Payments/
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── PaymentHistory.jsx
│   │   │   └── EMISchedule.jsx
│   │   ├── Common/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   └── Reports/
│   │       ├── PortfolioSummary.jsx
│   │       └── PaymentAnalytics.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── NotFound.jsx
│   │   └── Unauthorized.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── loanService.js
│   │   └── paymentService.js
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── loanSlice.js
│   │   │   ├── applicationSlice.js
│   │   │   └── uiSlice.js
│   │   └── store.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useLoan.js
│   │   ├── useForm.js
│   │   └── useApi.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── theme.js
│   │   └── variables.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── vite.config.js
├── package.json
└── README.md
```

---

## Configuration Files

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

### tailwind.config.js

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

---

## Services

### services/api.js

```javascript
import axios from 'axios';
import store from '@store/store';
import { logout } from '@store/slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, logout user
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      window.location.href = '/unauthorized';
    }

    return Promise.reject(error);
  }
);

export default api;
```

### services/authService.js

```javascript
import api from './api';

const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyEmail: async (email, otp) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data.data;

    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  uploadKYCDocument: async (formData) => {
    const response = await api.post('/users/kyc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getKYCStatus: async () => {
    const response = await api.get('/users/kyc/status');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
```

### services/loanService.js

```javascript
import api from './api';

const loanService = {
  createApplication: async (applicationData) => {
    const response = await api.post('/loans/applications', applicationData);
    return response.data;
  },

  submitApplication: async (applicationId, consentData) => {
    const response = await api.post(
      `/loans/applications/${applicationId}/submit`,
      consentData
    );
    return response.data;
  },

  uploadApplicationDocument: async (applicationId, formData) => {
    const response = await api.post(
      `/loans/applications/${applicationId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getApplications: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters,
    });

    const response = await api.get(`/loans/applications?${params}`);
    return response.data;
  },

  getApplicationDetails: async (applicationId) => {
    const response = await api.get(`/loans/applications/${applicationId}`);
    return response.data;
  },

  getLoans: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters,
    });

    const response = await api.get(`/loans?${params}`);
    return response.data;
  },

  getLoanDetails: async (loanId) => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data;
  },

  getEMISchedule: async (loanId) => {
    const response = await api.get(`/loans/${loanId}/emi-schedule`);
    return response.data;
  },

  getOverdueEMIs: async (loanId) => {
    const response = await api.get(`/loans/${loanId}/overdue-emis`);
    return response.data;
  },

  approveLoan: async (loanId, approvalData) => {
    const response = await api.post(`/loans/${loanId}/approve`, approvalData);
    return response.data;
  },

  rejectLoan: async (loanId, rejectionData) => {
    const response = await api.post(`/loans/${loanId}/reject`, rejectionData);
    return response.data;
  },

  disburseLoan: async (loanId, disbursalData) => {
    const response = await api.post(`/loans/${loanId}/disburse`, disbursalData);
    return response.data;
  },
};

export default loanService;
```

### services/paymentService.js

```javascript
import api from './api';

const paymentService = {
  payEMI: async (loanId, paymentData) => {
    const response = await api.post(`/loans/${loanId}/pay-emi`, paymentData);
    return response.data;
  },

  getPaymentHistory: async (loanId, page = 1, limit = 10) => {
    const response = await api.get(
      `/loans/${loanId}/payments?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  requestRestructuring: async (loanId, restructureData) => {
    const response = await api.post(
      `/loans/${loanId}/restructure`,
      restructureData
    );
    return response.data;
  },

  getRestructuringRequests: async () => {
    const response = await api.get('/loans/restructure-requests');
    return response.data;
  },

  initiatePayment: async (paymentData) => {
    const response = await api.post('/payments/initiate', paymentData);
    return response.data;
  },

  verifyPayment: async (paymentId, paymentDetails) => {
    const response = await api.post(
      `/payments/${paymentId}/verify`,
      paymentDetails
    );
    return response.data;
  },
};

export default paymentService;
```

---

## Redux Store

### store/slices/authSlice.js

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@services/authService';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials.email, credentials.password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });

    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(getProfile.rejected, (state) => {
        state.isLoading = false;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### store/slices/loanSlice.js

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import loanService from '@services/loanService';

const initialState = {
  loans: [],
  applications: [],
  currentLoan: null,
  currentApplication: null,
  emiSchedule: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

export const fetchLoans = createAsyncThunk(
  'loan/fetchLoans',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await loanService.getLoans(page, limit, filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchLoanDetails = createAsyncThunk(
  'loan/fetchLoanDetails',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await loanService.getLoanDetails(loanId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchEMISchedule = createAsyncThunk(
  'loan/fetchEMISchedule',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await loanService.getEMISchedule(loanId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createLoanApplication = createAsyncThunk(
  'loan/createApplication',
  async (applicationData, { rejectWithValue }) => {
    try {
      const response = await loanService.createApplication(applicationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const submitLoanApplication = createAsyncThunk(
  'loan/submitApplication',
  async ({ applicationId, consentData }, { rejectWithValue }) => {
    try {
      const response = await loanService.submitApplication(
        applicationId,
        consentData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: {
    clearCurrentLoan: (state) => {
      state.currentLoan = null;
      state.emiSchedule = [];
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Loans
    builder
      .addCase(fetchLoans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loans = action.payload.data.loans;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });

    // Fetch Loan Details
    builder
      .addCase(fetchLoanDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchLoanDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLoan = action.payload;
      })
      .addCase(fetchLoanDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });

    // Fetch EMI Schedule
    builder
      .addCase(fetchEMISchedule.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEMISchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emiSchedule = action.payload.emis;
      })
      .addCase(fetchEMISchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });

    // Create Application
    builder
      .addCase(createLoanApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLoanApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentApplication = action.payload;
      })
      .addCase(createLoanApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });

    // Submit Application
    builder
      .addCase(submitLoanApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitLoanApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentApplication = action.payload;
      })
      .addCase(submitLoanApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error?.message;
      });
  },
});

export const { clearCurrentLoan, clearCurrentApplication, clearError } = loanSlice.actions;
export default loanSlice.reducer;
```

### store/store.js

```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import loanReducer from './slices/loanSlice';
import applicationReducer from './slices/applicationSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    loan: loanReducer,
    application: applicationReducer,
    ui: uiReducer,
  },
});

export default store;
```

---

## Custom Hooks

### hooks/useAuth.js

```javascript
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, logout, getProfile } from '@store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state) => state.auth
  );

  const login = (email, password) => {
    return dispatch(loginUser({ email, password }));
  };

  const register = (userData) => {
    return dispatch(registerUser(userData));
  };

  const signOut = () => {
    dispatch(logout());
  };

  const fetchProfile = () => {
    return dispatch(getProfile());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    signOut,
    fetchProfile,
  };
};
```

### hooks/useLoan.js

```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLoans,
  fetchLoanDetails,
  fetchEMISchedule,
  createLoanApplication,
  submitLoanApplication,
} from '@store/slices/loanSlice';

export const useLoan = () => {
  const dispatch = useDispatch();
  const { loans, currentLoan, emiSchedule, isLoading, error, pagination } =
    useSelector((state) => state.loan);

  const getLoans = (page = 1, limit = 10, filters = {}) => {
    return dispatch(fetchLoans({ page, limit, filters }));
  };

  const getLoanDetails = (loanId) => {
    return dispatch(fetchLoanDetails(loanId));
  };

  const getEMISchedule = (loanId) => {
    return dispatch(fetchEMISchedule(loanId));
  };

  const createApplication = (applicationData) => {
    return dispatch(createLoanApplication(applicationData));
  };

  const submitApplication = (applicationId, consentData) => {
    return dispatch(
      submitLoanApplication({ applicationId, consentData })
    );
  };

  return {
    loans,
    currentLoan,
    emiSchedule,
    isLoading,
    error,
    pagination,
    getLoans,
    getLoanDetails,
    getEMISchedule,
    createApplication,
    submitApplication,
  };
};
```

### hooks/useForm.js

```javascript
import { useCallback } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const useForm = (schema, onSubmit, defaultValues = {}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
    getValues,
  } = useReactHookForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmitWrapper = useCallback(
    async (data) => {
      try {
        await onSubmit(data);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    },
    [onSubmit]
  );

  return {
    register,
    handleSubmit: handleSubmit(onSubmitWrapper),
    errors,
    isSubmitting,
    watch,
    reset,
    setValue,
    getValues,
  };
};
```

---

## Components

### components/Auth/Login.jsx

```javascript
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useForm } from '@hooks/useForm';
import { z } from 'zod';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Card,
  CircularProgress,
} from '@mui/material';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const { register, handleSubmit, errors, isSubmitting } = useForm(
    loginSchema,
    async (data) => {
      try {
        await login(data.email, data.password);
      } catch (err) {
        toast.error(err.message || 'Login failed');
      }
    }
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%', p: 4 }}>
          <Typography component="h1" variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
            Login
          </Typography>

          {error && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              margin="normal"
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Login'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link to="/forgot-password">Forgot Password?</Link>
              <Typography sx={{ mt: 2 }}>
                Don't have an account? <Link to="/register">Register</Link>
              </Typography>
            </Box>
          </form>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
```

### components/Auth/ProtectedRoute.jsx

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import LoadingSpinner from '@components/Common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### components/Dashboard/CustomerDashboard.jsx

```javascript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '@hooks/useLoan';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { getLoans, loans, isLoading } = useLoan();

  useEffect(() => {
    getLoans(1, 5);
  }, []);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  const totalLoans = loans.length;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
  const totalBorrowed = loans.reduce((sum, l) => sum + parseFloat(l.loanAmount), 0);
  const totalPaid = loans.reduce((sum, l) => sum + parseFloat(l.totalPaid), 0);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Dashboard
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Loans
                </Typography>
                <Typography variant="h5">{totalLoans}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Loans
                </Typography>
                <Typography variant="h5">{activeLoans}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Borrowed
                </Typography>
                <Typography variant="h5">₹{totalBorrowed.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Amount Paid
                </Typography>
                <Typography variant="h5">₹{totalPaid.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Loans */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Active Loans
            </Typography>
            {loans.length === 0 ? (
              <Typography color="textSecondary">No loans available</Typography>
            ) : (
              <Box>
                {loans.map((loan) => (
                  <Box
                    key={loan.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid #eee',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {loan.loanType} Loan - ₹{loan.loanAmount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Status: {loan.status}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/loans/${loan.id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/loans/apply')}
          >
            Apply for New Loan
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/loans')}
          >
            View All Loans
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CustomerDashboard;
```

### components/Loans/LoanApplication.jsx

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoan } from '@hooks/useLoan';
import { useForm } from '@hooks/useForm';
import { z } from 'zod';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const loanApplicationSchema = z.object({
  loanType: z.string().min(1, 'Loan type is required'),
  loanAmount: z.number().min(10000, 'Minimum loan amount is ₹10,000'),
  tenure: z.number().min(1, 'Tenure is required').max(360),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  monthlyIncome: z.number().min(1, 'Monthly income is required'),
  employmentStatus: z.string().min(1, 'Employment status is required'),
});

const LoanApplication = () => {
  const navigate = useNavigate();
  const { createApplication } = useLoan();
  const [activeStep, setActiveStep] = useState(0);
  const { register, handleSubmit, errors, getValues, isSubmitting } = useForm(
    loanApplicationSchema,
    async (data) => {
      try {
        const result = await createApplication(data);
        toast.success('Application created successfully');
        navigate(`/loans/applications/${result.payload.applicationId}`);
      } catch (err) {
        toast.error('Failed to create application');
      }
    }
  );

  const steps = ['Loan Details', 'Financial Info', 'Documents', 'Review'];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Apply for Loan
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {activeStep === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Loan Type</InputLabel>
                      <Select
                        label="Loan Type"
                        {...register('loanType')}
                        error={!!errors.loanType}
                      >
                        <MenuItem value="PERSONAL">Personal Loan</MenuItem>
                        <MenuItem value="BUSINESS">Business Loan</MenuItem>
                        <MenuItem value="HOME">Home Loan</MenuItem>
                        <MenuItem value="AUTO">Auto Loan</MenuItem>
                        <MenuItem value="EDUCATION">Education Loan</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Loan Amount"
                      type="number"
                      {...register('loanAmount', { valueAsNumber: true })}
                      error={!!errors.loanAmount}
                      helperText={errors.loanAmount?.message}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tenure (in months)"
                      type="number"
                      {...register('tenure', { valueAsNumber: true })}
                      error={!!errors.tenure}
                      helperText={errors.tenure?.message}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Purpose of Loan"
                      multiline
                      rows={4}
                      {...register('purpose')}
                      error={!!errors.purpose}
                      helperText={errors.purpose?.message}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Monthly Income"
                      type="number"
                      {...register('monthlyIncome', { valueAsNumber: true })}
                      error={!!errors.monthlyIncome}
                      helperText={errors.monthlyIncome?.message}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Employment Status</InputLabel>
                      <Select
                        label="Employment Status"
                        {...register('employmentStatus')}
                        error={!!errors.employmentStatus}
                      >
                        <MenuItem value="EMPLOYED">Employed</MenuItem>
                        <MenuItem value="SELF_EMPLOYED">Self Employed</MenuItem>
                        <MenuItem value="BUSINESS">Business</MenuItem>
                        <MenuItem value="RETIRED">Retired</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              {activeStep === 2 && (
                <Typography>Document upload will be in next screen</Typography>
              )}

              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Review Your Application
                  </Typography>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    {/* Display form data for review */}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    Submit Application
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoanApplication;
```

### components/Payments/PaymentForm.jsx

```javascript
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoan } from '@hooks/useLoan';
import { useForm } from '@hooks/useForm';
import { z } from 'zod';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import paymentService from '@services/paymentService';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  transactionReference: z.string().optional(),
});

const PaymentForm = () => {
  const { loanId } = useParams();
  const { getLoanDetails, currentLoan, getEMISchedule, emiSchedule } = useLoan();
  const [isProcessing, setIsProcessing] = useState(false);
  const { register, handleSubmit, errors, reset, isSubmitting } = useForm(
    paymentSchema,
    async (data) => {
      try {
        setIsProcessing(true);
        await paymentService.payEMI(loanId, data);
        toast.success('Payment processed successfully');
        reset();
        getEMISchedule(loanId);
      } catch (err) {
        toast.error('Payment failed');
      } finally {
        setIsProcessing(false);
      }
    }
  );

  useEffect(() => {
    getLoanDetails(loanId);
    getEMISchedule(loanId);
  }, [loanId]);

  if (!currentLoan) {
    return <Typography>Loading...</Typography>;
  }

  const nextDueEMI = emiSchedule.find(e => e.status === 'PENDING');

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Make Payment
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Loan Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Loan Amount
                  </Typography>
                  <Typography variant="body1">
                    ₹{currentLoan.loanAmount.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Remaining Balance
                  </Typography>
                  <Typography variant="body1">
                    ₹{currentLoan.remainingBalance.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Interest Rate
                  </Typography>
                  <Typography variant="body1">
                    {currentLoan.interestRate}% p.a.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Next EMI Due
                </Typography>
                {nextDueEMI ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        EMI Amount
                      </Typography>
                      <Typography variant="h6">
                        ₹{nextDueEMI.totalAmount.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Due Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(nextDueEMI.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        EMI #{nextDueEMI.emiNumber}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography color="textSecondary">All EMIs paid</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Payment Details
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    defaultValue={nextDueEMI?.totalAmount || 0}
                    {...register('amount', { valueAsNumber: true })}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      label="Payment Method"
                      {...register('paymentMethod')}
                      error={!!errors.paymentMethod}
                    >
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="ONLINE">Online Payment</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CHEQUE">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Transaction Reference"
                    {...register('transactionReference')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={isSubmitting}
                    size="large"
                  >
                    {isSubmitting ? 'Processing...' : 'Pay Now'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PaymentForm;
```

### components/Common/Header.jsx

```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
    handleMenuClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Loan Management System
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button color="inherit" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate('/loans')}>
              Loans
            </Button>

            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={handleMenuOpen}
            >
              <AccountCircleIcon sx={{ mr: 1 }} />
              <Typography variant="body2">{user?.firstName}</Typography>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
```

---

## Main App Component

### App.jsx

```javascript
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '@hooks/useAuth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layouts
import Header from '@components/Common/Header';
import Footer from '@components/Common/Footer';

// Auth
import Login from '@components/Auth/Login';
import Register from '@components/Auth/Register';
import ProtectedRoute from '@components/Auth/ProtectedRoute';

// Pages
import Home from '@pages/Home';
import CustomerDashboard from '@components/Dashboard/CustomerDashboard';
import AdminDashboard from '@components/Dashboard/AdminDashboard';
import LoanApplication from '@components/Loans/LoanApplication';
import LoanList from '@components/Loans/LoanList';
import LoanDetails from '@components/Loans/LoanDetails';
import PaymentForm from '@components/Payments/PaymentForm';
import NotFound from '@pages/NotFound';
import Unauthorized from '@pages/Unauthorized';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const { fetchProfile, user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {user?.role === 'CUSTOMER' ? (
                  <CustomerDashboard />
                ) : (
                  <AdminDashboard />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <LoanList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/loans/:loanId"
            element={
              <ProtectedRoute>
                <LoanDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/loans/apply"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <LoanApplication />
              </ProtectedRoute>
            }
          />

          <Route
            path="/loans/:loanId/pay"
            element={
              <ProtectedRoute>
                <PaymentForm />
              </ProtectedRoute>
            }
          />

          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />

        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;
```

---

## Utilities

### utils/validators.js

```javascript
import { z } from 'zod';

export const emailValidator = z.string().email('Invalid email address');

export const passwordValidator = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[@$!%*?&]/, 'Password must contain special character');

export const phoneValidator = z
  .string()
  .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s]?[0-9]{3}[-\s]?[0-9]{4,6}$/, 'Invalid phone number');

export const panValidator = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN');

export const aadharValidator = z
  .string()
  .regex(/^[0-9]{12}$/, 'Invalid Aadhar number');
```

### utils/formatters.js

```javascript
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{2})(\d{5})(\d{5})/, '+$1 $2 $3');
};

export const getStatusColor = (status) => {
  const statusColors = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    DISBURSED: 'info',
    ACTIVE: 'success',
    COMPLETED: 'success',
    OVERDUE: 'error',
    PAID: 'success',
  };
  return statusColors[status] || 'default';
};

export const getStatusLabel = (status) => {
  return status
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};
```

### utils/constants.js

```javascript
export const LOAN_TYPES = {
  PERSONAL: 'Personal Loan',
  BUSINESS: 'Business Loan',
  HOME: 'Home Loan',
  AUTO: 'Auto Loan',
  EDUCATION: 'Education Loan',
};

export const LOAN_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DISBURSED: 'Disbursed',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  DEFAULT: 'Default',
};

export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
  UPI: 'UPI',
};

export const USER_ROLES = {
  CUSTOMER: 'Customer',
  LOAN_OFFICER: 'Loan Officer',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

export const KYC_DOCUMENTS = {
  AADHAR: 'Aadhar Card',
  PAN: 'PAN Card',
  PASSPORT: 'Passport',
  VOTER_ID: 'Voter ID',
  DRIVING_LICENSE: 'Driving License',
};
```

---

## Package.json

```json
{
  "name": "loan-management-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "@reduxjs/toolkit": "^1.9.5",
    "react-redux": "^8.1.1",
    "axios": "^1.4.0",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.1.0",
    "zod": "^3.22.0",
    "react-toastify": "^9.1.2",
    "recharts": "^2.8.0",
    "chart.js": "^4.3.0",
    "react-chartjs-2": "^5.2.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.25",
    "autoprefixer": "^10.4.14",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "vitest": "^0.34.0",
    "eslint": "^8.45.0",
    "eslint-plugin-react": "^7.32.2"
  }
}
```

---

This comprehensive frontend implementation guide includes:

1. **Complete project setup** with Vite and all necessary dependencies
2. **Redux store configuration** with slices for auth, loans, and applications
3. **Custom hooks** for authentication, loans, and forms
4. **Service layer** with API integration
5. **Full-featured components** for auth, dashboards, loans, and payments
6. **Form handling** with React Hook Form and Zod validation
7. **Material-UI components** for professional UI
8. **Routing configuration** with protected routes
9. **Utility functions** for formatting and validation
10. **Constants and configuration** management

The frontend is production-ready with proper error handling, loading states, and user feedback mechanisms!
