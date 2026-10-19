const axios = require('axios');
const { io } = require('socket.io-client');

const BASE = 'http://localhost:4000';
const API = `${BASE}/api`;

function waitFor(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

async function main() {
  console.log('== Login customer + admin ==');
  const custLogin = await axios.post(`${API}/auth/login`, { phone: '0900000002', password: 'User@123' });
  const custToken = custLogin.data.data.accessToken;
  console.log('Customer logged in:', custLogin.data.data.user.full_name);

  const adminLogin = await axios.post(`${API}/auth/login`, { phone: '0900000001', password: 'Admin@123' });
  const adminToken = adminLogin.data.data.accessToken;
  console.log('Admin logged in:', adminLogin.data.data.user.full_name);

  console.log('\n== REST: customer gets/creates own conversation ==');
  const custAuthHeader = { headers: { Authorization: `Bearer ${custToken}` } };
  const adminAuthHeader = { headers: { Authorization: `Bearer ${adminToken}` } };

  const mine = await axios.get(`${API}/chat/mine`, custAuthHeader);
  const conversationId = mine.data.data.conversation.id;
  console.log('Conversation id:', conversationId, '| existing messages:', mine.data.data.messages.length);

  console.log('\n== Connect sockets (JWT auth in handshake) ==');
  const custSocket = io(BASE, { auth: { token: custToken }, transports: ['websocket'] });
  const adminSocket = io(BASE, { auth: { token: adminToken }, transports: ['websocket'] });

  await Promise.all([waitFor(custSocket, 'connect'), waitFor(adminSocket, 'connect')]);
  console.log('Both sockets connected. custSocket.id=', custSocket.id, '| adminSocket.id=', adminSocket.id);

  // Admin mở đúng hội thoại này để nhận tin realtime
  await new Promise((resolve, reject) => {
    adminSocket.emit('admin:join_conversation', { conversationId }, (res) => {
      if (res.ok) resolve(); else reject(new Error(res.error));
    });
  });
  console.log('Admin joined conversation room.');

  console.log('\n== 1) Customer gửi tin -> admin phải nhận realtime ==');
  const adminReceivedP = waitFor(adminSocket, 'chat:message');
  const custSendAck = await new Promise((resolve, reject) => {
    custSocket.emit('chat:send', { content: 'Shop ơi, chân gà còn hàng không ạ?' }, (res) => {
      if (res.ok) resolve(res); else reject(new Error(res.error));
    });
  });
  const adminReceived = await adminReceivedP;
  console.log('Customer send ACK ok, message id=', custSendAck.message.id);
  console.log('Admin received realtime:', adminReceived.content, '| sender_role=', adminReceived.sender_role);
  if (adminReceived.content !== 'Shop ơi, chân gà còn hàng không ạ?') throw new Error('Nội dung admin nhận không khớp!');
  console.log('>>> OK: customer -> admin realtime hoạt động đúng');

  console.log('\n== 2) Admin trả lời -> customer phải nhận realtime ==');
  const custReceivedP = waitFor(custSocket, 'chat:message');
  const adminSendAck = await new Promise((resolve, reject) => {
    adminSocket.emit('admin:send', { conversationId, content: 'Dạ còn hàng ạ, shop giao trong 30 phút!' }, (res) => {
      if (res.ok) resolve(res); else reject(new Error(res.error));
    });
  });
  const custReceived = await custReceivedP;
  console.log('Admin send ACK ok, message id=', adminSendAck.message.id);
  console.log('Customer received realtime:', custReceived.content, '| sender_role=', custReceived.sender_role);
  if (custReceived.sender_role !== 'ADMIN') throw new Error('sender_role sai!');
  console.log('>>> OK: admin -> customer realtime hoạt động đúng');

  console.log('\n== 3) Kiểm tra lại lịch sử đã lưu thật trong DB qua REST ==');
  const historyAfter = await axios.get(`${API}/chat/mine`, custAuthHeader);
  const msgs = historyAfter.data.data.messages;
  console.log('Tổng số tin nhắn trong lịch sử:', msgs.length);
  console.log(msgs.map((m) => `[${m.sender_role}] ${m.content}`).join('\n'));
  if (msgs.length < 2) throw new Error('Lịch sử không lưu đủ tin nhắn!');
  console.log('>>> OK: lịch sử chat được lưu thật trong PostgreSQL');

  console.log('\n== 4) Admin: danh sách hội thoại + tổng unread ==');
  const convList = await axios.get(`${API}/admin/chat/conversations`, adminAuthHeader);
  console.log('Số hội thoại admin thấy:', convList.data.data.length);
  const found = convList.data.data.find((c) => c.id === conversationId);
  console.log('Hội thoại của khách trong danh sách admin:', found ? `OK (preview: "${found.last_message_preview}")` : 'KHÔNG THẤY!');
  if (!found) throw new Error('Admin không thấy hội thoại trong danh sách!');

  console.log('\n== 5) Phân quyền: customer không được dùng admin:send ==');
  const rejectAck = await new Promise((resolve) => {
    custSocket.emit('admin:send', { conversationId, content: 'hack thử' }, (res) => resolve(res));
  });
  console.log('Customer thử gọi admin:send ->', rejectAck);
  if (rejectAck.ok) throw new Error('LỖI BẢO MẬT: customer gọi được admin:send!');
  console.log('>>> OK: customer bị chặn khi gọi sự kiện dành cho admin');

  custSocket.close();
  adminSocket.close();
  console.log('\n################ TẤT CẢ TEST CHAT PASSED ################');
}

main().catch((err) => {
  console.error('TEST FAILED:', err.message);
  process.exit(1);
});
