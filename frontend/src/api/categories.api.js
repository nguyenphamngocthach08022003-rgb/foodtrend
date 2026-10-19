import client from './axiosClient';

export const getCategories = () => client.get('/categories');
export const getCategoryBySlug = (slug) => client.get(`/categories/${slug}`);
