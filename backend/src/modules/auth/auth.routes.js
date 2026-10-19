const express = require('express');
const controller = require('./auth.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const rateLimit = require('../../middlewares/rateLimit.middleware');

const router = express.Router();

// Chống spam gửi mail / dò mã: tối đa 30 yêu cầu / 10 phút / IP cho nhóm OTP; 100 cho đăng nhập
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: Number(process.env.OTP_RATE_LIMIT_MAX) || 30, message: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau vài phút.' });
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100, message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau vài phút.' });

router.post('/register/request-code', otpLimiter, controller.requestRegisterCode);
router.post('/register/resend', otpLimiter, controller.resendRegisterCode);
router.post('/register/verify', otpLimiter, controller.verifyRegister);

router.post('/login', loginLimiter, controller.login);
router.post('/refresh-token', controller.refresh);
router.post('/forgot-password', otpLimiter, controller.forgotPassword);
router.post('/reset-password', otpLimiter, controller.resetPassword);

router.get('/me', requireAuth, controller.me);
router.put('/me', requireAuth, controller.updateProfile);
router.put('/change-password', requireAuth, controller.changePassword);

module.exports = router;
