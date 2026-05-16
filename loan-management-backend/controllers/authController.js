const authService = require('../services/authService');
const { User } = require('../models');
const logger = require('../utils/logger');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, phone, role } = req.body;
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: { message: 'All fields are required' } });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters' } });
    }
    const user = await authService.registerUser({ username, email, password, firstName, lastName, phone, role });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { userId: user.id, email: user.email, role: user.role },
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
    }
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
    res.json({
      success: true,
      data: {
        accessToken, refreshToken,
        user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, kycStatus: user.kycStatus },
      },
    });
  } catch (err) { next(err); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: { message: 'Refresh token required' } });
    const tokens = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'refreshToken', 'loginAttempts', 'lockUntil'] }
    });
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const user = await User.findByPk(req.user.id);
    await user.update({ firstName, lastName, phone, address });
    res.json({ success: true, message: 'Profile updated', data: { id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, address: user.address } });
  } catch (err) { next(err); }
};
