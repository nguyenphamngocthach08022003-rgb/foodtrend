const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const service = require('./addresses.service');

exports.list = asyncHandler(async (req, res) => {
  const items = await service.list(req.user.id);
  return ok(res, items);
});

exports.create = asyncHandler(async (req, res) => {
  const item = await service.create(req.user.id, req.body);
  return ok(res, item, 'Thêm địa chỉ thành công.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await service.update(req.user.id, req.params.id, req.body);
  return ok(res, item, 'Cập nhật địa chỉ thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.user.id, req.params.id);
  return ok(res, null, 'Xoá địa chỉ thành công.');
});

exports.setDefault = asyncHandler(async (req, res) => {
  const item = await service.setDefault(req.user.id, req.params.id);
  return ok(res, item, 'Đặt làm địa chỉ mặc định thành công.');
});
