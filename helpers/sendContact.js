import nodeMailer from "nodemailer";

export const sendContactEmail = async (options) => {
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
    to: "hr@assuredjob.com", //this is receiver email
    // to: "dataanalyst.novanectar@gmail.com", //this is receiver email
    subject: options.subject || "New Enquiry Received",
html: `
<div style="font-family: Arial, sans-serif; padding: 0; background-color: #f9f9f9; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    
    <style>
      @media only screen and (max-width: 600px) {
        .container {
          padding: 15px !important;
        }
        .inner-padding {
          padding: 20px 15px !important;
        }
        .table-responsive {
          width: 100% !important;
          display: block;
          overflow-x: auto;
        }
        .table-responsive table {
          width: 100% !important;
        }
        h2 {
          font-size: 22px !important;
        }
        p, td, li {
          font-size: 14px !important;
        }
      }
    </style>

    <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
      <h2 style="margin: 0; font-size: 24px;">New Website Enquiry</h2>
    </div>

    <div class="container" style="padding: 30px;">
      <p style="font-size: 16px; color: #333;">A new enquiry has been received from <strong>${options.fullName}</strong>. Please find the details below:</p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;" class="inner-padding">
        <h3 style="color: #4f46e5; margin-top: 0;">Enquiry Details:</h3>

        <div class="table-responsive">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
              <td style="padding: 8px 0; color: #333;">${options.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; color: #333;">${options.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone Number:</td>
              <td style="padding: 8px 0; color: #333;">${options.contactNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Subject/Service Interested:</td>
              <td style="padding: 8px 0; color: #333;">${options.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Message:</td>
              <td style="padding: 8px 0; color: #333;">"${options.message}"</td>
            </tr>
          </table>
        </div>
      </div>

      <p style="font-size: 15px; color: #555;">Please reach out to the applicant at the earliest. If this enquiry needs to be redirected to another department or team member, kindly forward accordingly.</p>
      <br/>
    </div>

    <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
      © 2025 AssuredJob.com. Automated Notification – Please do not reply.
    </div>

  </div>
</div>
`

  };

  const mailOption2 = {
    from: process.env.SMTP_MAIL,
    // to: options.email,
    // to: "career@assuredjob.com",
    to: options.email, //this is receiver email
    subject:
      options.subject ||
      "Enquiry Received – Thank You for connecting AssuredJob",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
      <h2>Enquiry Received – Thank You!</h2>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333;">Dear ${options.fullName},</p>

      <p style="font-size: 15px; color: #555;">Thank you for reaching out to AssuredJob. We have successfully received your enquiry. Our team is reviewing your details, and you can expect a response within <strong>24 to 36 working hours</strong>.</p>

      <p style="font-size: 15px; color: #555;">For any further assistance, feel free to contact us at:</p>

      <ul style="font-size: 15px; color: #555; line-height: 1.6;">
        <li>📧 Email: <a href="mailto:hr@assuredjob.com" style="color: #4f46e5; text-decoration: none;">hr@assuredjob.com</a></li>
        <li>📞 Phone: 8860159136</li>
      </ul>

      <p style="font-size: 15px; color: #555;">We appreciate your interest and look forward to connecting with you soon!</p>

      <p style="font-size: 15px; color: #555;">Warm regards,<br/><strong>Team AssuredJob</strong></p>
      <p style="font-size: 14px; color: #4f46e5;"><a href="https://www.assuredjob.com" style="color: #4f46e5; text-decoration: none;">www.assuredjob.com</a></p>
    </div>

    <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
      © 2025 AssuredJob.com. All rights reserved.
    </div>
  </div>
</div>
        `,
  };

  await transporter.sendMail(mailOption);
  await transporter.sendMail(mailOption2);
};
