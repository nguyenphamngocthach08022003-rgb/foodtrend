const nodemailer = require("nodemailer");
const env = require("../../config/env");

let transporter = null;

function getTransporter() {
  if (!env.mail.enabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure, // Gmail: 465 + secure=true
      auth: { user: env.mail.user, pass: env.mail.pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

// Khung email chung: tiêu đề đỏ thương hiệu, nội dung, chân trang
function layout({ preheader, title, bodyHtml }) {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FBF3E7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2A1810;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF3E7;padding:28px 12px;">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 18px rgba(42,24,16,0.10);">
   <tr><td style="background:#D62839;padding:26px 28px;text-align:center;">
     <div style="font-size:34px;line-height:1;">🌶️</div>
     <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;margin-top:6px;">FoodTrend</div>
     <div style="font-size:13px;color:#FCE3E1;margin-top:2px;">Món ăn vặt hot trend mỗi ngày</div>
   </td></tr>
   <tr><td style="padding:30px 30px 8px;">
     <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:#2A1810;">${title}</h1>
     ${bodyHtml}
   </td></tr>
   <tr><td style="padding:8px 30px 28px;">
     <p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #EAD9BE;font-size:12.5px;line-height:1.6;color:#8A7863;">
       Đây là email tự động từ FoodTrend, vui lòng không trả lời trực tiếp. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email — tài khoản của bạn vẫn an toàn.
     </p>
   </td></tr>
  </table>
 </td></tr>
</table></body></html>`;
}

function codeBox(code) {
  return `<div style="margin:22px 0;text-align:center;">
    <div style="display:inline-block;background:#FCE3E1;border:2px dashed #D62839;border-radius:14px;padding:14px 28px;">
      <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#A81E2C;padding-left:10px;">${escapeHtml(code)}</span>
    </div></div>`;
}

const paragraph = (html) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#4a372b;">${html}</p>`;

async function send({ to, subject, html, text }) {
  const tp = getTransporter();
  if (!tp) {
    // Chưa cấu hình Gmail: chỉ in ra console (CHỈ phục vụ dev). Nơi gọi biết qua devMode.
    // eslint-disable-next-line no-console
    console.log(
      `\n[mail] ⚠️  Chưa cấu hình MAIL_USER / MAIL_APP_PASSWORD -> KHÔNG gửi email thật.\n[mail]    To: ${to}\n[mail]    Subject: ${subject}\n`,
    );
    return { devMode: true };
  }
  await tp.sendMail({
    from: `"${env.mail.fromName}" <${env.mail.user}>`,
    to,
    subject,
    text,
    html,
  });
  return { devMode: false };
}

function sendRegisterCode({ to, name, code, ttlMinutes }) {
  const subject = `${code} là mã xác nhận đăng ký FoodTrend của bạn`;
  const html = layout({
    preheader: `Mã xác nhận: ${code} (hết hạn sau ${ttlMinutes} phút)`,
    title: `Chào ${escapeHtml(name)}, chỉ còn một bước nữa thôi! 🎉`,
    bodyHtml:
      paragraph(
        "Cảm ơn bạn đã đăng ký tài khoản FoodTrend. Nhập mã xác nhận dưới đây vào trang đăng ký để hoàn tất:",
      ) +
      codeBox(code) +
      paragraph(
        `Mã có hiệu lực trong <b>${ttlMinutes} phút</b>. Vì sự an toàn của bạn, tuyệt đối <b>không chia sẻ mã này</b> cho bất kỳ ai, kể cả người tự xưng là nhân viên FoodTrend.`,
      ),
  });
  const text = `Chào ${name},\n\nMã xác nhận đăng ký FoodTrend của bạn là: ${code}\nMã có hiệu lực trong ${ttlMinutes} phút. Không chia sẻ mã này cho bất kỳ ai.\n\nNếu bạn không đăng ký, hãy bỏ qua email này.`;
  return send({ to, subject, html, text });
}

function sendResetCode({ to, name, code, ttlMinutes }) {
  const subject = `${code} là mã đặt lại mật khẩu FoodTrend`;
  const html = layout({
    preheader: `Mã đặt lại mật khẩu: ${code} (hết hạn sau ${ttlMinutes} phút)`,
    title: "Yêu cầu đặt lại mật khẩu 🔐",
    bodyHtml:
      paragraph(
        `Chào ${escapeHtml(name)}, chúng tôi nhận được yêu cầu lấy lại mật khẩu cho tài khoản FoodTrend của bạn. Nhập mã dưới đây để tạo mật khẩu mới:`,
      ) +
      codeBox(code) +
      paragraph(
        `Mã có hiệu lực trong <b>${ttlMinutes} phút</b>. Nếu không phải bạn yêu cầu, hãy bỏ qua email này và cân nhắc đổi mật khẩu nếu nghi ngờ bị lộ.`,
      ),
  });
  const text = `Chào ${name},\n\nMã đặt lại mật khẩu FoodTrend của bạn là: ${code}\nMã có hiệu lực trong ${ttlMinutes} phút.\n\nNếu không phải bạn yêu cầu, hãy bỏ qua email này.`;
  return send({ to, subject, html, text });
}

function sendPasswordChanged({ to, name }) {
  const subject = "Mật khẩu FoodTrend của bạn vừa được thay đổi";
  const html = layout({
    preheader: "Mật khẩu tài khoản vừa được đặt lại thành công.",
    title: "Mật khẩu đã được thay đổi ✅",
    bodyHtml:
      paragraph(
        `Chào ${escapeHtml(name)}, mật khẩu tài khoản FoodTrend của bạn vừa được đặt lại thành công.`,
      ) +
      paragraph(
        'Nếu <b>không phải bạn</b> thực hiện, hãy lập tức dùng chức năng "Quên mật khẩu" để đặt lại và liên hệ shop để được hỗ trợ.',
      ),
  });
  const text = `Chào ${name},\n\nMật khẩu tài khoản FoodTrend của bạn vừa được đặt lại. Nếu không phải bạn, hãy đặt lại mật khẩu ngay và liên hệ shop.`;
  return send({ to, subject, html, text });
}

// Kiểm tra cấu hình Gmail ngay khi khởi động (không làm sập server nếu lỗi)
async function verifyConnection() {
  const tp = getTransporter();
  if (!tp) return { enabled: false };
  try {
    await tp.verify();
    return { enabled: true, ok: true };
  } catch (err) {
    return { enabled: true, ok: false, error: err };
  }
}

// Giải thích lỗi SMTP bằng tiếng Việt, dễ hiểu
function explainMailError(err) {
  const msg = String((err && (err.response || err.message)) || err);
  if (
    err &&
    (err.code === "EAUTH" ||
      /535|Username and Password not accepted|Invalid login/i.test(msg))
  ) {
    return 'Gmail từ chối đăng nhập. Hãy dùng "Mật khẩu ứng dụng" 16 ký tự (không phải mật khẩu Gmail thường) và đã bật Xác minh 2 bước.';
  }
  if (
    err &&
    (["ECONNECTION", "ETIMEDOUT", "ESOCKET"].includes(err.code) ||
      /ENOTFOUND|ECONNREFUSED/i.test(msg))
  ) {
    return "Không kết nối được tới máy chủ Gmail (smtp.gmail.com:465). Kiểm tra Internet / tường lửa / antivirus.";
  }
  return msg;
}

module.exports = {
  sendRegisterCode,
  sendResetCode,
  sendPasswordChanged,
  sendPaymentConfirmed,
  verifyConnection,
  explainMailError,
};

function sendPaymentConfirmed({ to, name, orderCode, totalAmount }) {
  const subject = `FoodTrend xác nhận thanh toán thành công - ${orderCode}`;

  const safeName = escapeHtml(name || "Quý khách");
  const safeOrderCode = escapeHtml(orderCode);
  const safeAmount = escapeHtml(
    Number(totalAmount).toLocaleString("vi-VN") + " ₫",
  );

  const html = layout({
    preheader: `Đơn hàng ${safeOrderCode} đã được xác nhận thanh toán.`,
    title: "Thanh toán thành công! 🎉",
    bodyHtml:
      paragraph(`Xin chào <b>${safeName}</b>,`) +
      paragraph(
        "FoodTrend chân thành cảm ơn bạn đã tin tưởng và lựa chọn mua sắm tại cửa hàng chúng tôi.",
      ) +
      paragraph(
        `Chúng tôi xác nhận đã nhận được thanh toán cho đơn hàng <b>${safeOrderCode}</b>.`,
      ) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#FBF3E7;border-radius:12px;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;color:#6B5748;">Mã đơn hàng</td>
          <td style="padding:16px 18px;font-size:14px;font-weight:700;text-align:right;color:#2A1810;">${safeOrderCode}</td>
        </tr>
        <tr>
          <td style="padding:0 18px 16px;font-size:14px;color:#6B5748;">Tổng thanh toán</td>
          <td style="padding:0 18px 16px;font-size:16px;font-weight:800;text-align:right;color:#D62839;">${safeAmount}</td>
        </tr>
        <tr>
          <td style="padding:0 18px 16px;font-size:14px;color:#6B5748;">Trạng thái</td>
          <td style="padding:0 18px 16px;font-size:14px;font-weight:700;text-align:right;color:#218838;">Đã thanh toán</td>
        </tr>
      </table>` +
      paragraph(
        "Đơn hàng của bạn sẽ tiếp tục được xử lý theo quy trình của FoodTrend. Cảm ơn bạn đã đồng hành cùng chúng tôi!",
      ) +
      paragraph("Trân trọng,<br><b>Đội ngũ FoodTrend</b>"),
  });

  const text =
    `Xin chào ${name || "Quý khách"},\n\n` +
    `FoodTrend xác nhận đã nhận được thanh toán cho đơn hàng ${orderCode}.\n` +
    `Tổng thanh toán: ${safeAmount}\n` +
    "Trạng thái: Đã thanh toán\n\n" +
    "Cảm ơn bạn đã tin tưởng và mua sắm tại FoodTrend!\n" +
    "Trân trọng,\nĐội ngũ FoodTrend";

  return send({ to, subject, html, text });
}
