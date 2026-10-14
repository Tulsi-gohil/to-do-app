const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateOtp, sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  return null;
}

function setOtp(user, purpose) {
  const code = generateOtp();
  user.otp = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    purpose,
  };
  return code;
}

// REGISTER — create user + send OTP
router.post(
  '/register',
  [
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Full name must be 2–80 characters.'),
    body('username')
      .trim()
      .matches(usernameRegex)
      .withMessage('Username must be 3–30 letters, numbers, or underscores.'),
    body('email')
      .trim()
      .toLowerCase()
      .matches(emailRegex)
      .withMessage('Please enter a valid email address.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
    body('phone')
      .trim()
      .matches(phoneRegex)
      .withMessage('Please enter a valid phone number.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const { fullName, username, email, password, phone } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUsername = username.toLowerCase().trim();

      const existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
      });

      if (existing) {
        if (existing.email === normalizedEmail) {
          return res.status(409).json({ message: 'Email is already registered.' });
        }
        return res.status(409).json({ message: 'Username is already taken.' });
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = new User({
        fullName: fullName.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashed,
        phone: phone.trim(),
        isVerified: false,
      });

      const otp = setOtp(user, 'register');
      await user.save();
      await sendOtpEmail(normalizedEmail, otp, 'register');

      return res.status(201).json({
        message: 'Registration started. Check your email for the OTP.',
        email: normalizedEmail,
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ message: 'Server error during registration.' });
    }
  }
);

// VERIFY REGISTER OTP
router.post(
  '/verify-otp',
  [
    body('email')
      .trim()
      .toLowerCase()
      .matches(emailRegex)
      .withMessage('Please enter a valid email address.'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const email = req.body.email.toLowerCase().trim();
      const otp = String(req.body.otp).trim();

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'No account found with this email.' });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: 'Email is already verified. Please log in.' });
      }

      if (
        !user.otp?.code ||
        user.otp.purpose !== 'register' ||
        user.otp.code !== otp
      ) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      }

      if (user.otp.expiresAt < new Date()) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      user.isVerified = true;
      user.otp = undefined;
      await user.save();

      const token = signToken(user._id);

      return res.json({
        message: 'Email verified successfully.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (err) {
      console.error('Verify OTP error:', err);
      return res.status(500).json({ message: 'Server error verifying OTP.' });
    }
  }
);

// RESEND OTP (register)
router.post(
  '/resend-otp',
  [
    body('email')
      .trim()
      .toLowerCase()
      .matches(emailRegex)
      .withMessage('Please enter a valid email address.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const email = req.body.email.toLowerCase().trim();
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'No account found with this email.' });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: 'Email is already verified.' });
      }

      const otp = setOtp(user, 'register');
      await user.save();
      await sendOtpEmail(email, otp, 'register');

      return res.json({ message: 'A new OTP has been sent to your email.' });
    } catch (err) {
      console.error('Resend OTP error:', err);
      return res.status(500).json({ message: 'Server error resending OTP.' });
    }
  }
);

// LOGIN — email OR username + password
router.post(
  '/login',
  [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const identifier = req.body.identifier.trim().toLowerCase();
      const { password } = req.body;

      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid email/username or password.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid email/username or password.' });
      }

      if (!user.isVerified) {
        const otp = setOtp(user, 'register');
        await user.save();
        await sendOtpEmail(user.email, otp, 'register');
        return res.status(403).json({
          message: 'Please verify your email first. A new OTP has been sent.',
          needsVerification: true,
          email: user.email,
        });
      }

      const token = signToken(user._id);

      return res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error during login.' });
    }
  }
);

// FORGOT PASSWORD — send OTP
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .toLowerCase()
      .matches(emailRegex)
      .withMessage('Please enter a valid email address.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const email = req.body.email.toLowerCase().trim();
      const user = await User.findOne({ email });

      // Don't leak whether email exists
      if (!user) {
        return res.json({
          message: 'If that email exists, an OTP has been sent.',
        });
      }

      if (!user.isVerified) {
        return res.status(400).json({
          message: 'Please verify your account before resetting the password.',
        });
      }

      const otp = setOtp(user, 'reset');
      await user.save();
      await sendOtpEmail(email, otp, 'reset');

      return res.json({ message: 'If that email exists, an OTP has been sent.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ message: 'Server error sending reset OTP.' });
    }
  }
);

// RESET PASSWORD — verify OTP + set new password
router.post(
  '/reset-password',
  [
    body('email')
      .trim()
      .toLowerCase()
      .matches(emailRegex)
      .withMessage('Please enter a valid email address.'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters.'),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const email = req.body.email.toLowerCase().trim();
      const otp = String(req.body.otp).trim();
      const { password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'No account found with this email.' });
      }

      if (
        !user.otp?.code ||
        user.otp.purpose !== 'reset' ||
        user.otp.code !== otp
      ) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      }

      if (user.otp.expiresAt < new Date()) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      user.password = await bcrypt.hash(password, 12);
      user.otp = undefined;
      await user.save();

      return res.json({ message: 'Password reset successful. You can log in now.' });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).json({ message: 'Server error resetting password.' });
    }
  }
);

// ME
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Not authorized.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    return res.json({ user });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

module.exports = router;
