import client from './axiosClient';

export const getCart = () => client.get('/cart');
export const addToCart = (data) => client.post('/cart/items', data);
export const updateCartItem = (itemId, quantity) => client.put(`/cart/items/${itemId}`, { quantity });
export const removeCartItem = (itemId) => client.delete(`/cart/items/${itemId}`);
export const clearCart = () => client.delete('/cart');
