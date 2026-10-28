const asyncHandler = require("../../utils/asyncHandler");
const { ok, paginated } = require("../../utils/apiResponse");
const service = require("./orders.service");

exports.checkout = asyncHandler(async (req, res) => {
  const order = await service.checkout(req.user.id, req.body);
  return ok(res, order, "Đặt hàng thành công.", 201);
});

exports.listMine = asyncHandler(async (req, res) => {
  const { items, pagination } = await service.listMine(req.user.id, req.query);
  return paginated(res, items, pagination);
});

exports.getMine = asyncHandler(async (req, res) => {
  const order = await service.getOrderDetail(req.params.id, req.user.id);
  return ok(res, order);
});

exports.cancel = asyncHandler(async (req, res) => {
  const order = await service.cancelOrder(req.user.id, req.params.id);
  return ok(res, order, "Huỷ đơn hàng thành công.");
});

exports.confirmMockPayment = asyncHandler(async (req, res) => {
  const order = await service.confirmMockPayment(req.user.id, req.params.id);
  return ok(res, order, "Thanh toán thành công (giả lập).");
});

// ---- admin ----

exports.adminList = asyncHandler(async (req, res) => {
  const { items, pagination } = await service.adminList(req.query);
  return paginated(res, items, pagination);
});

exports.adminGetById = asyncHandler(async (req, res) => {
  const order = await service.getOrderDetail(req.params.id, null);
  return ok(res, order);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await service.updateStatus(req.params.id, {
    ...req.body,
    adminId: req.user.id,
  });
  return ok(res, order, "Cập nhật trạng thái đơn hàng thành công.");
});

exports.verifyBankTransfer = asyncHandler(async (req, res) => {
  const order = await service.verifyBankTransfer(req.params.id, {
    adminId: req.user.id,
    note: req.body.note,
  });

  return ok(res, order, "Xác nhận thanh toán chuyển khoản thành công.");
});
