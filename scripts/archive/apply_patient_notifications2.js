const fs = require('fs');

const controllerPath = 'C:\\curevan_node\\src\\controllers\\appointments\\appointmentsController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

// 1. Accept Booking
const acceptTarget = `    await t.commit();
    return res.json({ success: true, message: "Booking accepted successfully" });`;

const acceptReplacement = `    const [patientRows] = await sequelize.query(
      \`SELECT fcm_token FROM users WHERE id = :patientId\`,
      { replacements: { patientId: appt.patient_id }, type: QueryTypes.SELECT, transaction: t }
    );
    if (patientRows && patientRows.fcm_token) {
      await firebaseNotifier.sendToTherapist(
        patientRows.fcm_token,
        "Booking Accepted",
        \`Your booking request for \${appt.date} has been accepted by \${therapistName || 'your therapist'}. Please complete the payment to confirm.\`
      );
    }
    
    await t.commit();
    return res.json({ success: true, message: "Booking accepted successfully" });`;

if (code.includes(acceptTarget) && !code.includes("Booking Accepted")) {
  code = code.replace(acceptTarget, acceptReplacement);
}

// 2. Reject Booking
const rejectTarget = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Rejected' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );`;
const rejectReplacement = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Rejected' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );
    
    const [patientRows2] = await sequelize.query(
      \`SELECT fcm_token FROM users WHERE id = :patientId\`,
      { replacements: { patientId: appt.patient_id }, type: QueryTypes.SELECT }
    );
    if (patientRows2 && patientRows2.fcm_token) {
      await firebaseNotifier.sendToTherapist(
        patientRows2.fcm_token,
        "Booking Rejected",
        \`Your booking request for \${appt.date} has been rejected by the therapist.\`
      );
    }`;
if (code.includes(rejectTarget) && !code.includes("Booking Rejected")) {
  code = code.replace(rejectTarget, rejectReplacement);
}

// 3. Cancel Booking
const cancelTarget = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Cancelled' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );`;
const cancelReplacement = `    await sequelize.query(
      \`UPDATE appointments SET status = 'Cancelled' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );
    
    const [patientRows3] = await sequelize.query(
      \`SELECT fcm_token FROM users WHERE id = :patientId\`,
      { replacements: { patientId: appt.patient_id }, type: QueryTypes.SELECT }
    );
    if (patientRows3 && patientRows3.fcm_token) {
      const isTherapist = (appt.therapist_id == userId);
      if (isTherapist || (req.user && req.user.role === 'admin')) {
        await firebaseNotifier.sendToTherapist(
          patientRows3.fcm_token,
          "Appointment Cancelled",
          \`Your appointment for \${appt.date} has been cancelled.\`
        );
      }
    }`;
if (code.includes(cancelTarget) && !code.includes("Appointment Cancelled")) {
  code = code.replace(cancelTarget, cancelReplacement);
}

// 4. Update PCR
const pcrTarget = `    // 7️⃣ Commit transaction
    await t.commit();`;
const pcrReplacement = `    // Send PCR status update notification to patient
    const [apptRows] = await sequelize.query(
      \`SELECT patient_id FROM appointments WHERE id = :appointmentId\`,
      { replacements: { appointmentId }, type: QueryTypes.SELECT, transaction: t }
    );
    if (apptRows && apptRows.patient_id) {
       const [patientRows4] = await sequelize.query(
         \`SELECT fcm_token FROM users WHERE id = :patientId\`,
         { replacements: { patientId: apptRows.patient_id }, type: QueryTypes.SELECT, transaction: t }
       );
       if (patientRows4 && patientRows4.fcm_token) {
         let pcrTitle = "PCR Updated";
         let pcrBody = \`Your appointment PCR status has been updated to \${pcrStatusToSave}.\`;
         if (pcrStatusToSave === 'submitted') {
            pcrTitle = "Payment Request";
            pcrBody = \`Your therapist has submitted the PCR. Please review and complete the payment.\`;
         }
         await firebaseNotifier.sendToTherapist(
           patientRows4.fcm_token,
           pcrTitle,
           pcrBody
         );
       }
    }

    // 7️⃣ Commit transaction
    await t.commit();`;
if (code.includes(pcrTarget) && !code.includes("PCR status update notification to patient")) {
  code = code.replace(pcrTarget, pcrReplacement);
}

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('appointmentsController.js patched successfully for patient notifications');
