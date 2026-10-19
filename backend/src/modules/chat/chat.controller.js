const asyncHandler = require('../../utils/asyncHandler');
const { ok, paginated } = require('../../utils/apiResponse');
const service = require('./chat.service');

// ---- customer ----
exports.getMine = asyncHandler(async (req, res) => {
  const result = await service.getMyConversation(req.user.id);
  return ok(res, result);
});

// ---- admin ----
exports.adminList = asyncHandler(async (req, res) => {
  const { items, pagination } = await service.adminListConversations(req.query);
  return paginated(res, items, pagination);
});

exports.adminGetConversation = asyncHandler(async (req, res) => {
  const result = await service.adminGetConversation(req.params.id);
  return ok(res, result);
});

exports.adminUnreadTotal = asyncHandler(async (req, res) => {
  const total = await service.adminTotalUnread();
  return ok(res, { total });
});
