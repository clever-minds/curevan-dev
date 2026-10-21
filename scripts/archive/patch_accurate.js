const fs = require('fs');
const targetFile = 'src/controllers/appointments/appointmentsController.js';
let content = fs.readFileSync(targetFile, 'utf8');

// The exact string to replace in acceptBookingRequest
const pcrInsertStart = `await sequelize.query(
      \`INSERT INTO pcr (
        appointment_id, patient_id, therapist_id, service_type_id,`;

const pcrInsertEnd = `transaction: t
      }
    );`;

const startIndex = content.indexOf(pcrInsertStart);
if (startIndex !== -1) {
    const endIndex = content.indexOf(pcrInsertEnd, startIndex) + pcrInsertEnd.length;
    
    const replacement1 = `const [pcrExists] = await sequelize.query(
      \`SELECT 1 FROM pcr WHERE appointment_id = :id LIMIT 1\`,
      { replacements: { id }, type: QueryTypes.SELECT, transaction: t }
    );

    if (pcrExists) {
      await sequelize.query(
        \`UPDATE pcr SET therapist_id = :therapistId WHERE appointment_id = :id\`,
        { replacements: { id, therapistId }, type: QueryTypes.UPDATE, transaction: t }
      );
    } else {
      await sequelize.query(
        \`INSERT INTO pcr (
          appointment_id, patient_id, therapist_id, service_type_id,
          chief_complaint, assessment, diagnosis, treatment_provided, plan_of_care,
          bp, hr, rr, temp, status, version, created_at, locked_at, history
        ) VALUES (
          :id, :patientId, :therapistId, :serviceTypeId,
          '', '', '', '', '', '', '', '', '',
          'not_started', 1, NOW(), NOW(), '[]'
        )\`,
        {
          replacements: {
            id,
            patientId: appt.patient_id,
            therapistId,
            serviceTypeId: appt.service_type_id
          },
          type: QueryTypes.INSERT,
          transaction: t
        }
      );
    }`;

    content = content.substring(0, startIndex) + replacement1 + content.substring(endIndex);
    console.log("Replaced target1 successfully.");
} else {
    console.log("Target 1 not found");
}

// The exact string to replace in rejectBookingRequest
const rejectStart = `if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ success: false, error: "Invalid appointment or unauthorized" });
    }`;

const rejectStartIndex = content.indexOf(rejectStart);
if (rejectStartIndex !== -1) {
    const replacement2 = `if (!appt) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }
    
    if ((appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ 
        success: false, 
        error: \`Invalid appointment or unauthorized. status: \${appt.status}, therapist_id: \${appt.therapist_id}, userId: \${userId}\` 
      });
    }`;
    
    content = content.substring(0, rejectStartIndex) + replacement2 + content.substring(rejectStartIndex + rejectStart.length);
    console.log("Replaced target2 successfully.");
} else {
    console.log("Target 2 not found");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("File saved successfully.");
