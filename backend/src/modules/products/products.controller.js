const asyncHandler = require('../../utils/asyncHandler');
const { paginated, ok } = require('../../utils/apiResponse');
const service = require('./products.service');

exports.list = asyncHandler(async (req, res) => {
  const { items, pagination } = await service.list(req.query);
  return paginated(res, items, pagination);
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const product = await service.getBySlug(req.params.slug, { req, userId: req.user?.id });
  return ok(res, product);
});

exports.adminList = asyncHandler(async (req, res) => {
  const { items, pagination } = await service.adminList(req.query);
  return paginated(res, items, pagination);
});

exports.adminGetById = asyncHandler(async (req, res) => {
  const product = await service.adminGetById(req.params.id);
  return ok(res, product);
});

exports.create = asyncHandler(async (req, res) => {
  const product = await service.create(req.body);
  return ok(res, product, 'Tạo sản phẩm thành công.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const product = await service.update(req.params.id, req.body);
  return ok(res, product, 'Cập nhật sản phẩm thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  return ok(res, null, 'Xoá sản phẩm thành công.');
});
