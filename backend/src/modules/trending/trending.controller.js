const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const service = require('./trending.service');

exports.getHot = asyncHandler(async (req, res) => {
  const items = await service.getHot(req.query);
  return ok(res, items);
});

exports.getBestSelling = asyncHandler(async (req, res) => {
  const items = await service.getBestSelling(req.query);
  return ok(res, items);
});

exports.adminList = asyncHandler(async (req, res) => {
  const items = await service.adminList();
  return ok(res, items);
});

exports.upsert = asyncHandler(async (req, res) => {
  const item = await service.upsert(req.body);
  return ok(res, item, 'Cập nhật trending thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.productId);
  return ok(res, null, 'Đã gỡ khỏi danh sách trending.');
});
