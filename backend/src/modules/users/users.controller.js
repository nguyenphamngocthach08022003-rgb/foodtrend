const asyncHandler = require('../../utils/asyncHandler');
const { ok, paginated } = require('../../utils/apiResponse');
const service = require('./users.service');

exports.adminList = asyncHandler(async (req, res) => {
  const { items, pagination } = await service.adminList(req.query);
  return paginated(res, items, pagination);
});

exports.adminGetById = asyncHandler(async (req, res) => {
  const item = await service.adminGetById(req.params.id);
  return ok(res, item);
});

exports.toggleActive = asyncHandler(async (req, res) => {
  const item = await service.toggleActive(req.params.id, req.body.is_active);
  return ok(res, item, 'Cập nhật trạng thái tài khoản thành công.');
});
