const asyncHandler = require('../../utils/asyncHandler');
const { ok, paginated } = require('../../utils/apiResponse');
const service = require('./reviews.service');

exports.listByProduct = asyncHandler(async (req, res) => {
  const { items, pagination } = await service.listByProduct(req.params.productId, req.query);
  return paginated(res, items, pagination);
});

exports.getReviewableOrders = asyncHandler(async (req, res) => {
  const items = await service.getReviewableOrders(req.user.id, req.params.productId);
  return ok(res, items);
});

exports.create = asyncHandler(async (req, res) => {
  const item = await service.create(req.user.id, req.body);
  return ok(res, item, 'Cảm ơn bạn đã đánh giá sản phẩm!', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await service.update(req.user.id, req.params.id, req.body);
  return ok(res, item, 'Cập nhật đánh giá thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.user.id, req.params.id);
  return ok(res, null, 'Xoá đánh giá thành công.');
});
