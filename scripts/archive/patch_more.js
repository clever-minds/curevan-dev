const fs = require('fs');

// Patch 1: appointmentsController.js (confirmPayment)
const apptPath = 'c:/curevan_node/src/controllers/appointments/appointmentsController.js';
let apptCode = fs.readFileSync(apptPath, 'utf8');

const confirmSearch = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Confirmed', payment_status = 'Paid' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );
    
    return res.json({ success: true, message: "Payment confirmed, appointment booked" });`;

const confirmReplace = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Confirmed', payment_status = 'Paid' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );
    
    // Notify Patient & Therapist
    try {
      const [details] = await sequelize.query(
        \`SELECT p.fcm_token AS patient_token, t.fcm_token AS therapist_token, a.date, a.time, t.name AS therapist_name
         FROM appointments a
         LEFT JOIN users p ON a.patient_id = p.id
         LEFT JOIN users t ON a.therapist_id = t.id
         WHERE a.id = :id\`,
        { replacements: { id }, type: QueryTypes.SELECT }
      );
      if (details) {
        if (details.patient_token) {
          await firebaseNotifier.sendToTherapist(
            details.patient_token,
            "Payment Confirmed",
            \`Your payment for the appointment on \${details.date} at \${details.time} is confirmed.\`,
            { type: "payment_confirmed", appointmentId: String(id) }
          );
        }
        if (details.therapist_token) {
          await firebaseNotifier.sendToTherapist(
            details.therapist_token,
            "Appointment Confirmed",
            \`Payment received. Your appointment on \${details.date} at \${details.time} is now confirmed.\`,
            { type: "appointment_confirmed", appointmentId: String(id) }
          );
        }
      }
    } catch(e) { console.error("Notification Error:", e); }
    
    return res.json({ success: true, message: "Payment confirmed, appointment booked" });`;

if (!apptCode.includes('Payment Confirmed')) {
  apptCode = apptCode.replace(confirmSearch, confirmReplace);
  fs.writeFileSync(apptPath, apptCode, 'utf8');
  console.log("appointmentsController.js (payment) patched!");
}

// Patch 2: usersController.js (updateUser for approve/reject)
const usersPath = 'c:/curevan_node/src/controllers/users/usersController.js';
let usersCode = fs.readFileSync(usersPath, 'utf8');

const updateSearch = `    await sequelize.query(
      \`UPDATE users
       SET name = :name,
           email = :email,
           role = :role,
           status = :status,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id\`,
      {
        replacements: { id, name, email, role, status },
        type: QueryTypes.UPDATE,
      }
    );

    return res.success(null, "User updated successfully");`;

const updateReplace = `    await sequelize.query(
      \`UPDATE users
       SET name = :name,
           email = :email,
           role = :role,
           status = :status,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id\`,
      {
        replacements: { id, name, email, role, status },
        type: QueryTypes.UPDATE,
      }
    );

    // Notify User about status update
    try {
      const [u] = await sequelize.query(
        \`SELECT fcm_token FROM users WHERE id = :id\`,
        { replacements: { id }, type: QueryTypes.SELECT }
      );
      if (u && u.fcm_token) {
        await firebaseNotifier.sendToTherapist(
          u.fcm_token,
          "Account Updated",
          \`Your account status/role has been updated to \${status || role} by the admin.\`,
          { type: "account_updated" }
        );
      }
    } catch(e) { console.error("Notification Error:", e); }

    return res.success(null, "User updated successfully");`;

if (!usersCode.includes('Account Updated')) {
  usersCode = usersCode.replace(updateSearch, updateReplace);
  fs.writeFileSync(usersPath, usersCode, 'utf8');
  console.log("usersController.js (updateUser) patched!");
}
