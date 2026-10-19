const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const service = require('./categories.service');

exports.listPublic = asyncHandler(async (req, res) => {
  const items = await service.listActive();
  return ok(res, items);
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const item = await service.getBySlug(req.params.slug);
  return ok(res, item);
});

exports.listAll = asyncHandler(async (req, res) => {
  const items = await service.listAll();
  return ok(res, items);
});

exports.create = asyncHandler(async (req, res) => {
  const item = await service.create(req.body);
  return ok(res, item, 'Tạo danh mục thành công.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await service.update(req.params.id, req.body);
  return ok(res, item, 'Cập nhật danh mục thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  return ok(res, null, 'Xoá danh mục thành công.');
});
