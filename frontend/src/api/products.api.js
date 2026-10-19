import client from './axiosClient';

export const getProducts = (params) => client.get('/products', { params });
export const getProductBySlug = (slug) => client.get(`/products/${slug}`);
