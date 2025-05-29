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
    // to: options.email,
    to: "atulsemwal77@gmail.com",
    subject: options.subject,
    html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
                <h2>Sky-Wings Career Portal</h2>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">Dear ${
                  options.fullName || "Candidate"
                },</p>
                <p style="font-size: 15px; color: #555;">Thank you for submitting your resume! We have successfully received your application.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #4f46e5; margin-top: 0;">Application Details:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Full Name:</td>
                      <td style="padding: 8px 0; color: #333;">${
                        options.fullName
                      }</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                      <td style="padding: 8px 0; color: #333;">${
                        options.email
                      }</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Contact Number:</td>
                      <td style="padding: 8px 0; color: #333;">${
                        options.contactNumber
                      }</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Position Applied:</td>
                      <td style="padding: 8px 0; color: #333;">${
                        options.jobAppliedFor
                      }</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                      <td style="padding: 8px 0; color: #333;">${
                        options.city
                      }, ${options.state}</td>
                    </tr>
                    ${
                      options.resumeUrl
                        ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Resume:</td>
                      <td style="padding: 8px 0;">
                        <a href="${options.resumeUrl}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">📄 ${options.resumeFileName}</a>
                      </td>
                    </tr>`
                        : ""
                    }
                  </table>
                </div>

                <p style="font-size: 14px; color: #555;">Our HR team will review your application and get back to you within 3-5 business days. We appreciate your interest in joining Sky-Wings! ✈️</p>
                
                <div style="margin: 25px 0; padding: 15px; background: #e0f2fe; border-left: 4px solid #4f46e5; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>Next Steps:</strong><br/>
                    • Keep an eye on your email for updates<br/>
                    • Follow us on social media for company news<br/>
                    • Feel free to reach out if you have any questions
                  </p>
                </div>
                
                <br/>
                <p style="font-size: 14px; color: #999;">– The Sky-Wings HR Team</p>
              </div>
              <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
                © 2025 Sky-Wings. All rights reserved.<br/>
                <a href="mailto:hr@skywings.com" style="color: #4f46e5; text-decoration: none;">hr@skywings.com</a>
              </div>
            </div>
          </div>
        `,
  };

  await transporter.sendMail(mailOption);
};
