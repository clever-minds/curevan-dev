const fs = require('fs');
const file = 'C:/curevan_node/src/controllers/therapist/therapistController.js';
let content = fs.readFileSync(file, 'utf8');

const mailCode = `
    try {
      await transporter.sendMail({
        from: \`"Curevan" <\${process.env.MAIL_USER}>\`,
        to: email,
        subject: "Verify your Email - Curevan",
        html: \`
          <h2>Email Verification</h2>
          <p>Hi \${fullName || 'Therapist'},\</p>
          <p>Please click the link below to verify your email address:</p>
          <br>
          <a href="\${process.env.FRONTEND_URL}/verify-email?token=\${verificationToken}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
        \`
      });
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError);
    }
`;

// It might have been inserted into the commented out code earlier. Let's insert it into the active code at line 321.
// We can find the active response code:
const targetString = 'res.status(201).json({\n      status: true,\n      message: "Therapist Registered with Availability",';
if (!content.includes('transporter.sendMail({') || content.indexOf('transporter.sendMail({') < content.lastIndexOf('exports.registerTherapist')) {
    content = content.replace(targetString, mailCode + '\n    ' + targetString);
}

fs.writeFileSync(file, content);
console.log('patched again');
