# Loan Management System - Backend Implementation Guide

## Backend Setup & Configuration

### 1. Project Initialization

```bash
mkdir loan-management-backend
cd loan-management-backend
npm init -y

npm install express dotenv cors helmet express-rate-limit
npm install pg redis
npm install bcryptjs jsonwebtoken
npm install joi
npm install nodemailer
npm install aws-sdk
npm install winston morgan
npm install sequelize sequelize-cli
npm install --save-dev jest supertest
npm install --save-dev nodemon
```

### 2. Environment Configuration (.env)

```env
# Server
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loan_management_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_DIALECT=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (SendGrid/Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_EMAIL=noreply@loanapp.com

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=loan-documents
AWS_REGION=us-east-1

# Application Settings
BCRYPT_ROUNDS=10
PASSWORD_RESET_TOKEN_EXPIRY=1h
OTP_EXPIRY=5m
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15m

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

---

## Core Configuration Files

### app.js - Main Application File

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Middleware
app.use(helmet());

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/loans', require('./routes/loans'));
app.use('/api/v1/applications', require('./routes/applications'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/reports', require('./routes/reports'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error Handling Middleware (Must be last)
app.use(errorHandler);

module.exports = app;
```

### server.js - Server Entry Point

```javascript
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { initializeRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to Database
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Initialize Redis
    await initializeRedis();
    logger.info('✅ Redis connected successfully');

    // Start Server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

## Database Configuration

### config/database.js

```javascript
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  }
);

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  connectDatabase,
};
```

### config/redis.js

```javascript
const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis Client Connected'));

async function initializeRedis() {
  try {
    await client.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    throw error;
  }
}

module.exports = {
  redisClient: client,
  initializeRedis,
};
```

---

## Database Models

### models/User.js

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      len: [3, 50],
    },
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[+]?[(]?[0-9]{3}[)]?[-\s]?[0-9]{3}[-\s]?[0-9]{4,6}$/,
    },
  },
  role: {
    type: DataTypes.ENUM('CUSTOMER', 'LOAN_OFFICER', 'MANAGER', 'ADMIN'),
    defaultValue: 'CUSTOMER',
  },
  kycStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  kycDocuments: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  address: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockUntil: {
    type: DataTypes.DATE,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
  paranoid: true, // Soft delete enabled
  indexes: [
    {
      fields: ['email'],
    },
    {
      fields: ['username'],
    },
    {
      fields: ['role'],
    },
  ],
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  }
});

// Method to compare passwords
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = User;
```

### models/Loan.js

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  loanAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 10000,
      max: 10000000,
    },
  },
  disbursedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  loanType: {
    type: DataTypes.ENUM('PERSONAL', 'BUSINESS', 'HOME', 'AUTO', 'EDUCATION'),
    allowNull: false,
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  tenure: {
    type: DataTypes.INTEGER, // in months
    allowNull: false,
    validate: {
      min: 1,
      max: 360,
    },
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 
      'COMPLETED', 'REJECTED', 'DEFAULT'
    ),
    defaultValue: 'PENDING',
  },
  purpose: {
    type: DataTypes.TEXT,
  },
  collateral: {
    type: DataTypes.JSON,
  },
  processorId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  applicationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  approvalDate: {
    type: DataTypes.DATE,
  },
  disbursalDate: {
    type: DataTypes.DATE,
  },
  expectedClosureDate: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['applicationDate'],
    },
  ],
});

module.exports = Loan;
```

### models/EMISchedule.js

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EMISchedule = sequelize.define('EMISchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Loans',
      key: 'id',
    },
  },
  emiNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  principalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  interestAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'DEFAULTED'),
    defaultValue: 'PENDING',
  },
  paidDate: {
    type: DataTypes.DATE,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(15, 2),
  },
  balanceAmount: {
    type: DataTypes.DECIMAL(15, 2),
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['loanId', 'emiNumber'],
      unique: true,
    },
    {
      fields: ['dueDate'],
    },
    {
      fields: ['status'],
    },
  ],
});

module.exports = EMISchedule;
```

---

## Middleware

### middleware/auth.js

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      },
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt: ${req.user.id} tried to access ${req.originalUrl}`
      );
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorize,
};
```

### middleware/validation.js

```javascript
const Joi = require('joi');
const logger = require('../utils/logger');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      logger.warn('Validation error:', details);

      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details,
        },
      });
    }

    req.body = value;
    next();
  };
};

module.exports = { validate };
```

### middleware/errorHandler.js

```javascript
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Record already exists';
  }

  // In production, don't expose internal error details
  const response = {
    success: false,
    error: {
      code: errorCode,
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : message,
    },
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
```

---

## Services

### services/authService.js

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redisClient } = require('../config/redis');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class AuthService {
  async registerUser(userData) {
    try {
      // Check if user exists
      const existingUser = await User.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        const error = new Error('User already exists');
        error.statusCode = 409;
        error.errorCode = 'USER_EXISTS';
        throw error;
      }

      // Create user
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await redisClient.setex(
        `otp:${user.email}`,
        300, // 5 minutes
        otp
      );

      // Send verification email
      await emailService.sendVerificationEmail(user.email, otp);

      return {
        userId: user.id,
        email: user.email,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async verifyEmail(email, otp) {
    try {
      const storedOtp = await redisClient.get(`otp:${email}`);

      if (!storedOtp || storedOtp !== otp) {
        const error = new Error('Invalid OTP');
        error.statusCode = 400;
        error.errorCode = 'INVALID_OTP';
        throw error;
      }

      // Update user
      await User.update(
        { emailVerified: true },
        { where: { email } }
      );

      // Remove OTP
      await redisClient.del(`otp:${email}`);

      return { message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        error.errorCode = 'INVALID_CREDENTIALS';
        throw error;
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > new Date()) {
        const error = new Error('Account is locked. Please try again later.');
        error.statusCode = 429;
        error.errorCode = 'ACCOUNT_LOCKED';
        throw error;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment login attempts
        user.loginAttempts += 1;

        // Lock account after 5 failed attempts
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        await user.save();

        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        error.errorCode = 'INVALID_CREDENTIALS';
        throw error;
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          kycStatus: user.kycStatus,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken) {
    try {
      const decoded = jwt.verify(
        oldRefreshToken,
        process.env.JWT_REFRESH_SECRET
      );

      const user = await User.findByPk(decoded.id);

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const tokens = this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      const err = new Error('Invalid refresh token');
      err.statusCode = 401;
      err.errorCode = 'INVALID_REFRESH_TOKEN';
      throw err;
    }
  }
}

module.exports = new AuthService();
```

### services/loanService.js

```javascript
const Loan = require('../models/Loan');
const EMISchedule = require('../models/EMISchedule');
const User = require('../models/User');
const logger = require('../utils/logger');

class LoanService {
  async createLoan(loanData, userId) {
    try {
      const loan = await Loan.create({
        ...loanData,
        userId,
        status: 'PENDING',
      });

      logger.info(`Loan created: ${loan.id}`);

      return {
        loanId: loan.id,
        status: loan.status,
      };
    } catch (error) {
      logger.error('Loan creation error:', error);
      throw error;
    }
  }

  async generateEMISchedule(loanId) {
    try {
      const loan = await Loan.findByPk(loanId);

      if (!loan) {
        throw new Error('Loan not found');
      }

      // Calculate EMI
      const monthlyRate = loan.interestRate / 12 / 100;
      const numPayments = loan.tenure;
      const principal = parseFloat(loan.loanAmount);

      const emi = 
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

      // Generate schedule
      let balance = principal;
      const schedule = [];

      for (let i = 1; i <= numPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = emi - interestPayment;
        balance -= principalPayment;

        const dueDate = new Date(loan.disbursalDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        schedule.push({
          loanId,
          emiNumber: i,
          dueDate,
          principalAmount: Math.round(principalPayment * 100) / 100,
          interestAmount: Math.round(interestPayment * 100) / 100,
          totalAmount: emi,
          status: 'PENDING',
          balanceAmount: Math.max(0, Math.round(balance * 100) / 100),
        });
      }

      // Bulk create
      await EMISchedule.bulkCreate(schedule);

      logger.info(`EMI schedule generated for loan ${loanId}`);

      return {
        totalEMIs: numPayments,
        monthlyEMI: Math.round(emi * 100) / 100,
      };
    } catch (error) {
      logger.error('EMI schedule generation error:', error);
      throw error;
    }
  }

  async getLoanDetails(loanId, userId) {
    try {
      const loan = await Loan.findOne({
        where: { id: loanId, userId },
        include: {
          model: User,
          attributes: ['firstName', 'lastName', 'email'],
        },
      });

      if (!loan) {
        const error = new Error('Loan not found');
        error.statusCode = 404;
        throw error;
      }

      // Get EMI details
      const emis = await EMISchedule.findAll({
        where: { loanId },
        order: [['emiNumber', 'ASC']],
      });

      const paidEmis = emis.filter(e => e.status === 'PAID');
      const totalPaid = paidEmis.reduce((sum, e) => sum + parseFloat(e.paidAmount), 0);
      const remainingBalance = parseFloat(loan.loanAmount) - totalPaid;

      return {
        id: loan.id,
        loanAmount: loan.loanAmount,
        status: loan.status,
        interestRate: loan.interestRate,
        tenure: loan.tenure,
        loanType: loan.loanType,
        totalPaid: totalPaid,
        remainingBalance: remainingBalance,
        emis: emis,
        disbursalDate: loan.disbursalDate,
        expectedClosureDate: loan.expectedClosureDate,
      };
    } catch (error) {
      logger.error('Get loan details error:', error);
      throw error;
    }
  }

  async approveLoan(loanId, approvalData, processorId) {
    try {
      const loan = await Loan.findByPk(loanId);

      if (!loan) {
        throw new Error('Loan not found');
      }

      loan.status = 'APPROVED';
      loan.approvalDate = new Date();
      loan.interestRate = approvalData.interestRate;
      loan.processorId = processorId;
      loan.notes = approvalData.approvalNotes;

      await loan.save();

      logger.info(`Loan approved: ${loanId}`);

      return { loanId, status: 'APPROVED' };
    } catch (error) {
      logger.error('Loan approval error:', error);
      throw error;
    }
  }
}

module.exports = new LoanService();
```

---

## Controllers

### controllers/authController.js

```javascript
const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.registerUser(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Verification email sent.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.body;
      
      const result = await authService.verifyEmail(email, otp);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        const error = new Error('Refresh token not provided');
        error.statusCode = 400;
        throw error;
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
```

### controllers/loanController.js

```javascript
const loanService = require('../services/loanService');
const logger = require('../utils/logger');

class LoanController {
  async createLoan(req, res, next) {
    try {
      const result = await loanService.createLoan(req.body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLoanDetails(req, res, next) {
    try {
      const { loanId } = req.params;
      
      const loan = await loanService.getLoanDetails(loanId, req.user.id);

      res.status(200).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveLoan(req, res, next) {
    try {
      const { loanId } = req.params;
      
      const result = await loanService.approveLoan(
        loanId,
        req.body,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Loan approved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LoanController();
```

---

## Routes

### routes/auth.js

```javascript
const express = require('express');
const { validate } = require('../middleware/validation');
const authController = require('../controllers/authController');
const authValidations = require('../validations/authValidations');
const { authMiddleware } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Register
router.post(
  '/register',
  validate(authValidations.registerSchema),
  authController.register
);

// Verify Email
router.post(
  '/verify-email',
  validate(authValidations.verifyEmailSchema),
  authController.verifyEmail
);

// Login
router.post(
  '/login',
  validate(authValidations.loginSchema),
  authController.login
);

// Refresh Token
router.post(
  '/refresh',
  authController.refreshToken
);

// Logout
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

module.exports = router;
```

### routes/loans.js

```javascript
const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const loanController = require('../controllers/loanController');
const loanValidations = require('../validations/loanValidations');

const router = express.Router();

// Create Loan (Customer)
router.post(
  '/',
  authMiddleware,
  authorize('CUSTOMER'),
  validate(loanValidations.createLoanSchema),
  loanController.createLoan
);

// Get Loan Details
router.get(
  '/:loanId',
  authMiddleware,
  loanController.getLoanDetails
);

// Approve Loan (Loan Officer)
router.post(
  '/:loanId/approve',
  authMiddleware,
  authorize('LOAN_OFFICER', 'MANAGER'),
  validate(loanValidations.approveLoanSchema),
  loanController.approveLoan
);

module.exports = router;
```

---

## Validation Schemas

### validations/authValidations.js

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  
  email: Joi.string()
    .email()
    .required(),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
    }),
  
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required(),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required(),
  
  phone: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s]?[0-9]{3}[-\s]?[0-9]{4,6}$/)
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  
  password: Joi.string()
    .required(),
});

const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  
  otp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
};
```

---

## Utility Functions

### utils/logger.js

```javascript
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message);
  },
};

module.exports = logger;
```

---

## Testing Example

### tests/auth.test.js

```javascript
const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass@123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+919876543210',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should not register duplicate user', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass@123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+919876543210',
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'SecurePass@123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+919876543210',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'SecurePass@123',
          firstName: 'Login',
          lastName: 'Test',
          phone: '+919876543210',
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start app
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: loan_management_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    environment:
      NODE_ENV: development
      PORT: 5000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: loan_management_db
      DB_USER: postgres
      DB_PASSWORD: postgres
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## Package.json

```json
{
  "name": "loan-management-backend",
  "version": "1.0.0",
  "description": "Comprehensive Loan Management System Backend",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  },
  "keywords": ["loan", "management", "api", "nodejs"],
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "joi": "^17.9.2",
    "pg": "^8.10.0",
    "redis": "^4.6.5",
    "nodemailer": "^6.9.1",
    "aws-sdk": "^2.1400.0",
    "winston": "^3.8.2",
    "morgan": "^1.10.0",
    "sequelize": "^6.31.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.40.0"
  }
}
```

This backend implementation guide provides a solid foundation for building a production-ready Loan Management System. The code follows best practices for security, scalability, and maintainability.

Would you like me to create the frontend implementation guide next with React code examples?
