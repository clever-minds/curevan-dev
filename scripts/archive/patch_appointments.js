const fs = require('fs');

const controllerPath = 'c:/curevan_node/src/controllers/appointments/appointmentsController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

// Patch 1: acceptBookingRequest
const acceptSearch = `    await t.commit();
    return res.json({ success: true, message: "Booking accepted successfully" });`;
const acceptReplace = `    await t.commit();
    
    // Notify Patient
    try {
      const [patientRows] = await sequelize.query(
        \`SELECT fcm_token FROM users WHERE id = :patientId\`,
        { replacements: { patientId: appt.patient_id }, type: QueryTypes.SELECT }
      );
      if (patientRows && patientRows.fcm_token) {
        await firebaseNotifier.sendToTherapist(
          patientRows.fcm_token,
          "Booking Accepted",
          \`Your booking request for \${appt.date} has been accepted by \${therapistName || 'your therapist'}. Please complete the payment to confirm.\`,
          { type: "booking_accepted" }
        );
      }
    } catch (e) { console.error(e); }
    
    return res.json({ success: true, message: "Booking accepted successfully" });`;

if (!code.includes('Booking Accepted')) {
  code = code.replace(acceptSearch, acceptReplace);
}

// Patch 2: rejectBookingRequest query
const rejectQuerySearch = `SELECT status, therapist_id FROM appointments WHERE id = :id\`,`;
const rejectQueryReplace = `SELECT status, therapist_id, patient_id, date FROM appointments WHERE id = :id\`,`;

code = code.replace(rejectQuerySearch, rejectQueryReplace);

// Patch 3: rejectBookingRequest notify
const rejectSearch = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Rejected' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    return res.json({ success: true, message: "Booking request declined" });`;
const rejectReplace = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Rejected' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    // Notify Patient
    try {
      const [patientRows] = await sequelize.query(
        \`SELECT fcm_token FROM users WHERE id = :patientId\`,
        { replacements: { patientId: appt.patient_id }, type: QueryTypes.SELECT }
      );
      if (patientRows && patientRows.fcm_token) {
        await firebaseNotifier.sendToTherapist(
          patientRows.fcm_token,
          "Booking Rejected",
          \`Unfortunately, your booking request for \${appt.date} was declined by the therapist.\`,
          { type: "booking_rejected" }
        );
      }
    } catch (e) { console.error(e); }

    return res.json({ success: true, message: "Booking request declined" });`;

if (!code.includes('Booking Rejected')) {
  code = code.replace(rejectSearch, rejectReplace);
}

// Patch 4: cancelAppointment notify
const cancelSearch = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Cancelled' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    return res.json({ success: true, message: "Appointment Cancelled" });`;
const cancelReplace = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Cancelled' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    // Notify other party
    try {
      const otherUserId = (appt.patient_id == userId) ? appt.therapist_id : appt.patient_id;
      if (otherUserId) {
        const [otherRows] = await sequelize.query(
          \`SELECT fcm_token FROM users WHERE id = :otherUserId\`,
          { replacements: { otherUserId }, type: QueryTypes.SELECT }
        );
        if (otherRows && otherRows.fcm_token) {
          const role = (appt.patient_id == userId) ? "Patient" : "Therapist";
          await firebaseNotifier.sendToTherapist(
            otherRows.fcm_token,
            "Appointment Cancelled",
            \`Your appointment on \${appt.date} at \${appt.time} was cancelled by the \${role}.\`,
            { type: "appointment_cancelled" }
          );
        }
      }
    } catch (e) { console.error(e); }

    return res.json({ success: true, message: "Appointment Cancelled" });`;

if (!code.includes('Appointment Cancelled",')) {
  code = code.replace(cancelSearch, cancelReplace);
}

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('appointmentsController.js patched successfully!');
