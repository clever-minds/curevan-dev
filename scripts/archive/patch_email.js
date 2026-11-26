const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

let content = fs.readFileSync(path, 'utf8');

const regex = /if\s*\(patient\?\.email\)\s*\{\s*await\s*transporter\.sendMail\(\{\s*from:\s*`"Curevan Appointments" <\$\{process\.env\.MAIL_USER\}>`,\s*to:\s*patient\.email,\s*subject:\s*"Your Appointment is Booked",\s*html:\s*`[\s\S]*?`\s*\}\);\s*\}/;

const replacement = `let addressString = "";
      if (bookingData.mode === "home" && bookingData.addressId) {
        const [addr] = await sequelize.query(
          \`SELECT full_address, city, state, pincode FROM order_addresses WHERE id = :addressId\`,
          { replacements: { addressId: bookingData.addressId }, type: QueryTypes.SELECT }
        );
        if (addr) {
          addressString = \`\${addr.full_address || ''}, \${addr.city || ''}, \${addr.state || ''} - \${addr.pincode || ''}\`;
        }
      } else if (bookingData.mode === "clinic" && bookingData.therapistId) {
        const [therapistProfile] = await sequelize.query(
          \`SELECT full_address FROM therapist_profiles WHERE user_id = :therapistId\`,
          { replacements: { therapistId: bookingData.therapistId }, type: QueryTypes.SELECT }
        );
        if (therapistProfile && therapistProfile.full_address) {
          addressString = therapistProfile.full_address;
        }
      }

      if (patient?.email) {
        await transporter.sendMail({
          from: \`"Curevan Appointments" <\${process.env.MAIL_USER}>\`,
          to: patient.email,
          subject: "Your Appointment is Booked",
          html: \`
            <h3>Booking Confirmation</h3>
            <p>Hi \${bookingData.patientName},</p>
            <p>Your appointment has been successfully booked.</p>
            <ul>
              <li><strong>Date:</strong> \${bookingData.date}</li>
              <li><strong>Time:</strong> \${bookingData.time}</li>
              <li><strong>Therapist:</strong> \${bookingData.therapist}</li>
              <li><strong>Service:</strong> \${bookingData.therapyType}</li>
              <li><strong>Mode:</strong> \${bookingData.mode ? bookingData.mode.toUpperCase() : 'Not Specified'}</li>
              \${addressString ? \`<li><strong>Address:</strong> \${addressString}</li>\` : ''}
              <li><strong>Total Amount:</strong> ₹\${bookingData.totalAmount}</li>
            </ul>
            <p>Thank you for choosing Curevan.</p>
          \`
        });
      }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully patched appointmentsController.js");
} else {
    console.log("Target content not found. Regex did not match.");
}
