// Singleton giữ instance Socket.IO để các module khác (controller, service)
// có thể emit sự kiện mà không cần truyền io qua từng tầng.
let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.IO chưa được khởi tạo. Gọi setIO() trong server.js trước.');
  return ioInstance;
}

module.exports = { setIO, getIO };
