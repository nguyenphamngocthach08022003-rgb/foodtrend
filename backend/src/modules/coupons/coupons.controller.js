const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const service = require('./coupons.service');

exports.listPublic = asyncHandler(async (req, res) => {
  const items = await service.listPublicActive();
  return ok(res, items);
});

exports.validate = asyncHandler(async (req, res) => {
  const result = await service.validate(req.body);
  return ok(res, result, 'Áp dụng mã giảm giá thành công.');
});

exports.listMine = asyncHandler(async (req, res) => {
  const items = await service.listUserCoupons(req.user.id);
  return ok(res, items);
});

exports.collect = asyncHandler(async (req, res) => {
  const item = await service.collect(req.user.id, req.body.coupon_id);
  return ok(res, item, 'Đã lưu mã giảm giá.', 201);
});

exports.adminList = asyncHandler(async (req, res) => {
  const items = await service.adminList();
  return ok(res, items);
});

exports.create = asyncHandler(async (req, res) => {
  const item = await service.create(req.body);
  return ok(res, item, 'Tạo mã giảm giá thành công.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await service.update(req.params.id, req.body);
  return ok(res, item, 'Cập nhật mã giảm giá thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  return ok(res, null, 'Xoá mã giảm giá thành công.');
});
