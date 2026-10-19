import client from './axiosClient';

export const getMyConversation = () => client.get('/chat/mine');

export const adminGetConversations = (params) => client.get('/admin/chat/conversations', { params });
export const adminGetConversation = (id) => client.get(`/admin/chat/conversations/${id}`);
export const adminGetUnreadTotal = () => client.get('/admin/chat/unread-total');
