const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const service = require('./cart.service');

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await service.getCart(req.user.id);
  return ok(res, cart);
});

exports.addItem = asyncHandler(async (req, res) => {
  const cart = await service.addItem(req.user.id, req.body);
  return ok(res, cart, 'Đã thêm vào giỏ hàng.');
});

exports.updateItem = asyncHandler(async (req, res) => {
  const cart = await service.updateItem(req.user.id, req.params.itemId, req.body.quantity);
  return ok(res, cart, 'Cập nhật giỏ hàng thành công.');
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await service.removeItem(req.user.id, req.params.itemId);
  return ok(res, cart, 'Đã xoá khỏi giỏ hàng.');
});

exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await service.clearCart(req.user.id);
  return ok(res, cart, 'Đã xoá toàn bộ giỏ hàng.');
});
