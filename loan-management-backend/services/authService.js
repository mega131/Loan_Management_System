const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

class AuthService {
  generateTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
    return { accessToken, refreshToken };
  }

  async registerUser(userData) {
    const email = userData.email.toLowerCase();
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const err = new Error('User already exists with this email'); err.statusCode = 409; err.errorCode = 'USER_EXISTS'; throw err;
    }
    const user = await User.create({
      username: userData.username,
      email,
      passwordHash: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role || 'CUSTOMER',
    });
    // Generate OTP and store (mock - log to console in dev)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.setex(`otp:${user.email}`, 300, otp);
    logger.info(`[DEV] OTP for ${user.email}: ${otp}`);
    return user;
  }

  async loginUser(email, password) {
    const user = await User.findOne({ where: { email: email.toLowerCase(), isActive: true } });
    if (!user) {
      const err = new Error('Invalid email or password'); err.statusCode = 401; err.errorCode = 'INVALID_CREDENTIALS'; throw err;
    }
    // Check lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const err = new Error('Account temporarily locked. Try again later.'); err.statusCode = 423; throw err;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const attempts = (user.loginAttempts || 0) + 1;
      const update = { loginAttempts: attempts };
      if (attempts >= 5) update.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.update(update);
      const err = new Error('Invalid email or password'); err.statusCode = 401; err.errorCode = 'INVALID_CREDENTIALS'; throw err;
    }
    await user.update({ loginAttempts: 0, lockUntil: null, lastLogin: new Date() });
    const tokens = this.generateTokens(user);
    await user.update({ refreshToken: tokens.refreshToken });
    return { user, ...tokens };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findOne({ where: { id: decoded.id, refreshToken: token } });
      if (!user) {
        const err = new Error('Invalid refresh token'); err.statusCode = 401; throw err;
      }
      const tokens = this.generateTokens(user);
      await user.update({ refreshToken: tokens.refreshToken });
      return tokens;
    } catch (e) {
      const err = new Error('Invalid or expired refresh token'); err.statusCode = 401; throw err;
    }
  }

  async logout(userId) {
    await User.update({ refreshToken: null }, { where: { id: userId } });
  }
}

module.exports = new AuthService();
