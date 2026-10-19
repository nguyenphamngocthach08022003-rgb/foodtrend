import client from './axiosClient';

export const checkout = (data) => client.post('/orders/checkout', data);
export const getMyOrders = (params) => client.get('/orders', { params });
export const getOrderById = (id) => client.get(`/orders/${id}`);
export const cancelOrder = (id) => client.put(`/orders/${id}/cancel`);
export const confirmMockPayment = (id) => client.put(`/orders/${id}/confirm-mock-payment`);
