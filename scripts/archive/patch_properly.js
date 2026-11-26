const fs = require('fs');

const targetFile = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(targetFile, 'utf8');

const target1 = `    await sequelize.query(
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
    );`;

const replacement1 = `    const [pcrExists] = await sequelize.query(
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

const target2 = `    if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ success: false, error: "Invalid appointment or unauthorized" });
    }`;

const replacement2 = `    if (!appt) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }
    
    if ((appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ 
        success: false, 
        error: \`Invalid appointment or unauthorized. status: \${appt.status}, therapist_id: \${appt.therapist_id}, userId: \${userId}\` 
      });
    }`;

let changed = false;
if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    console.log("Replaced target1");
    changed = true;
} else {
    console.log("Target 1 not found!");
}

if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    console.log("Replaced target2");
    changed = true;
} else {
    console.log("Target 2 not found!");
}

if (changed) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("File saved!");
}
