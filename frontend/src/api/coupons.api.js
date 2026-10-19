import client from './axiosClient';

export const getPublicCoupons = () => client.get('/coupons');
export const validateCoupon = (data) => client.post('/coupons/validate', data);
export const getMyCoupons = () => client.get('/coupons/mine');
export const collectCoupon = (coupon_id) => client.post('/coupons/collect', { coupon_id });
