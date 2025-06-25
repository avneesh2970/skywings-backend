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
    to: "hr@assuredjob.com", //this is receiver email
    // to: "dataanalyst.novanectar@gmail.com", //this is receiver email
    subject: options.subject,
    html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
                <h2>Skywings Career Portal</h2>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">Dear HR,</p>
                <p style="font-size: 15px; color: #555;">This is to inform you that a new job application has been received and is ready for your review. Please find the candidate's details below:</p>
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
                   <p style="font-size: 15px; color: #555;">
        Kindly proceed with the preliminary screening in accordance with our recruitment protocols. 
        Please ensure the candidate is assessed within the standard <strong>3–5 business day review period</strong> and update the recruitment dashboard accordingly.
      </p>
      <p style="font-size: 15px; color: #555;">
        Should you require any further information, do not hesitate to reach out.
      </p>
                </div>                      
                <br/>
              </div>
              <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
                © 2025 Skywings. All rights reserved.<br/>
              </div>
            </div>
          </div>
        `,
  };

  const mailOption2 = {
    from: process.env.SMTP_MAIL,
    // to: options.email,
    // to: "career@assuredjob.com",
    to: options.email, //this is receiver email
    subject: options.subject,
    html: `
         <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
      <h2>Skywings Careers</h2>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333;">Dear Applicant,</p>
      <p style="font-size: 15px; color: #555;">
        Thank you for submitting your resume. We acknowledge receipt of your application.
      </p>
      <p style="font-size: 15px; color: #555;">
        Our Human Resources team will carefully review your application. You can expect to hear from us regarding the status of your application.
      </p>
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
  await transporter.sendMail(mailOption2);
};
