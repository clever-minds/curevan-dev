const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

let content = fs.readFileSync(path, 'utf8');

const replacement = `exports.rescheduleAppointment = async (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;
    const userId = req.user.id;
  
    try {
      const [appt] = await sequelize.query(
        \`SELECT status, patient_id, therapist_id FROM appointments WHERE id = :id\`,
        { replacements: { id }, type: QueryTypes.SELECT }
      );
  
      if (!appt) {
        return res.status(404).json({ success: false, error: "Appointment not found" });
      }
  
      if (appt.patient_id != userId) {
        return res.status(403).json({ success: false, error: "Unauthorized to reschedule this appointment" });
      }
  
      if (appt.status === 'Completed' || appt.status === 'Cancelled') {
        return res.status(400).json({ success: false, error: "Cannot reschedule at this stage" });
      }
  
      // Update the appointment
      await sequelize.query(
        \`UPDATE appointments SET date = :date, time = :time, status = 'Searching Therapist', therapist_id = NULL WHERE id = :id\`,
        { replacements: { id, date, time }, type: QueryTypes.UPDATE }
      );
      
      // Fetch users for notifications
      const [patient] = await sequelize.query(\`SELECT email, user_name, fcm_token FROM users WHERE id = :patientId\`, { replacements: { patientId: appt.patient_id }, type: QueryTypes.SELECT });
      
      let therapist = null;
      if (appt.therapist_id) {
          const [t] = await sequelize.query(\`SELECT email, user_name, fcm_token FROM users WHERE id = :therapistId\`, { replacements: { therapistId: appt.therapist_id }, type: QueryTypes.SELECT });
          therapist = t;
      }
      
      const admins = await sequelize.query(\`SELECT email, fcm_token FROM users WHERE role IN ('super_admin', 'admin', 'superadmin', 'therapyAdmin')\`, { type: QueryTypes.SELECT });
      
      const mailSender = process.env.MAIL_USER ? \`"Curevan Appointments" <\${process.env.MAIL_USER}>\` : '"Curevan Appointments" <noreply@curevan.com>';

      // Emails
      if (patient && patient.email) {
          transporter.sendMail({
              from: mailSender,
              to: patient.email,
              subject: "Your Appointment is Rescheduled",
              html: \`<p>Hi \${patient.user_name || 'Patient'},</p><p>Your appointment has been successfully rescheduled to \${date} at \${time}.</p>\`
          }).catch(e => console.error("Patient email error:", e));
      }
      
      if (therapist && therapist.email) {
          transporter.sendMail({
              from: mailSender,
              to: therapist.email,
              subject: "Appointment Rescheduled",
              html: \`<p>Hi \${therapist.user_name || 'Therapist'},</p><p>An appointment previously assigned to you has been rescheduled by the patient to \${date} at \${time}. You have been unassigned from this session.</p>\`
          }).catch(e => console.error("Therapist email error:", e));
      }
      
      for (const admin of admins) {
          if (admin.email) {
              transporter.sendMail({
                  from: mailSender,
                  to: admin.email,
                  subject: "System Alert: Appointment Rescheduled",
                  html: \`<p>Hi Admin,</p><p>Appointment ID \${id} has been rescheduled to \${date} at \${time}. The status is now 'Searching Therapist'.</p>\`
              }).catch(e => console.error("Admin email error:", e));
          }
      }
      
      // Notifications
      if (patient && patient.fcm_token) {
          firebaseNotifier.sendToTherapist(patient.fcm_token, "Appointment Rescheduled", \`Your appointment is now on \${date} at \${time}\`).catch(e => {});
      }
      
      if (therapist && therapist.fcm_token) {
          firebaseNotifier.sendToTherapist(therapist.fcm_token, "Appointment Rescheduled", \`An appointment was rescheduled and you are unassigned.\`).catch(e => {});
      }
      
      for (const admin of admins) {
          if (admin.fcm_token) {
              firebaseNotifier.sendToTherapist(admin.fcm_token, "Appointment Rescheduled", \`Appointment #\${id} is rescheduled to \${date} \${time}.\`).catch(e => {});
          }
      }
  
      return res.json({ success: true, message: "Appointment rescheduled successfully" });
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      return res.status(500).json({ success: false, error: "Failed to reschedule appointment" });
    }
  };`;

const regex = /exports\.rescheduleAppointment\s*=\s*async\s*\(\s*req,\s*res\s*\)\s*=>\s*\{[\s\S]*?return\s*res\.status\(500\)\.json\(\{ success: false, error: "Failed to reschedule appointment" \}\);\s*\}\s*\};/;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Patched successfully!");
} else {
    console.log("Could not find the target string.");
}
