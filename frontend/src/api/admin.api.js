import client from './axiosClient';

// Dashboard
export const getDashboardSummary = () => client.get('/admin/dashboard/summary');

// Categories
export const adminGetCategories = () => client.get('/admin/categories');
export const adminCreateCategory = (data) => client.post('/admin/categories', data);
export const adminUpdateCategory = (id, data) => client.put(`/admin/categories/${id}`, data);
export const adminDeleteCategory = (id) => client.delete(`/admin/categories/${id}`);

// Products
export const adminGetProducts = (params) => client.get('/admin/products', { params });
export const adminGetProductById = (id) => client.get(`/admin/products/${id}`);
export const adminCreateProduct = (data) => client.post('/admin/products', data);
export const adminUpdateProduct = (id, data) => client.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => client.delete(`/admin/products/${id}`);

// Variants
export const adminCreateVariant = (productId, data) => client.post(`/admin/products/${productId}/variants`, data);
export const adminUpdateVariant = (id, data) => client.put(`/admin/products/variants/${id}`, data);
export const adminDeleteVariant = (id) => client.delete(`/admin/products/variants/${id}`);

// Images
export const adminUploadImages = (productId, formData) =>
  client.post(`/admin/products/${productId}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminSetThumbnail = (imageId) => client.put(`/admin/products/images/${imageId}/thumbnail`);
export const adminDeleteImage = (imageId) => client.delete(`/admin/products/images/${imageId}`);

// Orders
export const adminGetOrders = (params) => client.get('/admin/orders', { params });
export const adminGetOrderById = (id) => client.get(`/admin/orders/${id}`);
export const adminUpdateOrderStatus = (id, data) => client.put(`/admin/orders/${id}/status`, data);

// Coupons
export const adminGetCoupons = () => client.get('/admin/coupons');
export const adminCreateCoupon = (data) => client.post('/admin/coupons', data);
export const adminUpdateCoupon = (id, data) => client.put(`/admin/coupons/${id}`, data);
export const adminDeleteCoupon = (id) => client.delete(`/admin/coupons/${id}`);

// Trending
export const adminGetTrending = () => client.get('/admin/trending');
export const adminUpsertTrending = (data) => client.put('/admin/trending', data);
export const adminRemoveTrending = (productId) => client.delete(`/admin/trending/${productId}`);

// Customers
export const adminGetCustomers = (params) => client.get('/admin/customers', { params });
export const adminGetCustomerById = (id) => client.get(`/admin/customers/${id}`);
export const adminToggleCustomerActive = (id, is_active) => client.put(`/admin/customers/${id}/active`, { is_active });
