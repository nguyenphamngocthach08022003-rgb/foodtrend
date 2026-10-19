import client from './axiosClient';

export const getFavorites = () => client.get('/favorites');
export const addFavorite = (product_id) => client.post('/favorites', { product_id });
export const removeFavorite = (productId) => client.delete(`/favorites/${productId}`);
