export function passwordResetOtpTemplate(otp: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset OTP</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f1f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1f5; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(108,0,105,0.08);">
          <tr>
            <td style="background-color:#6C0069; padding:28px 32px;">
              <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.5px;">EduERP</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 24px 32px;">
              <h3 style="margin:0 0 12px 0; color:#1a1a1a; font-size:20px; font-weight:600;">
                Password Reset Request
              </h3>
              <p style="margin:0 0 24px 0; color:#555555; font-size:14px; line-height:1.6;">
                You requested to reset your password. Use the following 6-digit One-Time Password (OTP) to proceed. This code is valid for the next <strong>10 minutes</strong>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px 0;">
                    <div style="display:inline-block; background-color:#fdf2fc; border:1.5px dashed #6C0069; border-radius:10px; padding:16px 36px;">
                      <span style="color:#6C0069; font-size:32px; font-weight:700; letter-spacing:8px;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0; color:#888888; font-size:13px; line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email — your account remains secure.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px 32px;">
              <p style="margin:0; color:#aaaaaa; font-size:12px; line-height:1.6; text-align:center;">
                This is an automated message from <strong style="color:#6C0069;">EduERP</strong>. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}