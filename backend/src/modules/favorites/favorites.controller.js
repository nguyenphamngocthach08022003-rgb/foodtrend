const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const service = require('./favorites.service');

exports.list = asyncHandler(async (req, res) => {
  const items = await service.list(req.user.id);
  return ok(res, items);
});

exports.add = asyncHandler(async (req, res) => {
  const item = await service.add(req.user.id, req.body.product_id);
  return ok(res, item, 'Đã thêm vào yêu thích.', 201);
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.user.id, req.params.productId);
  return ok(res, null, 'Đã bỏ yêu thích.');
});
