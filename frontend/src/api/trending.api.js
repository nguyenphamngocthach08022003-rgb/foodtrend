import client from './axiosClient';

export const getHotTrending = (limit = 10) => client.get('/trending/hot', { params: { limit } });
export const getBestSelling = (limit = 10) => client.get('/trending/best-selling', { params: { limit } });
