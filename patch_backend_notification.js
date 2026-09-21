const fs = require('fs');

const controllerPath = 'C:\\curevan_node\\src\\controllers\\appointments\\appointmentsController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

code = code.replace(
  `      \`SELECT status, patient_id, service_type_id, therapist_id FROM appointments WHERE id = :id FOR UPDATE\`,`,
  `      \`SELECT status, patient_id, service_type_id, therapist_id, date FROM appointments WHERE id = :id FOR UPDATE\`,`
);

code = code.replace(
  `    await sequelize.query(
      \`INSERT INTO pcr (`,
  `    const [patientRows] = await sequelize.query(
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

    await sequelize.query(
      \`INSERT INTO pcr (\``
);

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('appointmentsController.js patched successfully for patient notification');
