import nodeMailer from "nodemailer";

export const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOption = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
                <h2>Skywings Newsletter</h2>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">Hi there,</p>
                <p style="font-size: 15px; color: #555;">We've received your message:</p>
                <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                  ${options.message}
                </blockquote>
                <p style="font-size: 14px; color: #777;">Sent from: <strong>
                skywings@gmail.com
                </strong></p>
                <p style="font-size: 14px; color: #555;">We’ll get back to you as soon as possible. Thanks for being part of Skywings ✈️</p>
                <br/>
                <p style="font-size: 14px; color: #999;">– The Skywings Team</p>
              </div>
              <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
                © 2025 Skywings. All rights reserved.
              </div>
            </div>
          </div>
        `,
  };

  await transporter.sendMail(mailOption);
};
