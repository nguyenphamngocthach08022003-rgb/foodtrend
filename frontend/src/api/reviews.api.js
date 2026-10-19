import client from './axiosClient';

export const getReviewsByProduct = (productId, params) => client.get(`/reviews/product/${productId}`, { params });
export const getReviewableOrders = (productId) => client.get(`/reviews/product/${productId}/reviewable-orders`);
export const createReview = (data) => client.post('/reviews', data);
