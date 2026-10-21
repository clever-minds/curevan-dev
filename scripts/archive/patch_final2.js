const fs = require('fs');
const targetFile = 'src/controllers/appointments/appointmentsController.js';
let content = fs.readFileSync(targetFile, 'utf8');

const rejectStart = "if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {\n      return res.status(400).json({ success: false, error: \"Invalid appointment or unauthorized\" });\n    }";

const replacement2 = `if (!appt) {\n      return res.status(404).json({ success: false, error: "Appointment not found" });\n    }\n\n    if ((appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {\n      return res.status(400).json({ \n        success: false, \n        error: \`Invalid appointment or unauthorized. status: \${appt.status}, therapist_id: \${appt.therapist_id}, userId: \${userId}\` \n      });\n    }`;

content = content.replace(rejectStart, replacement2);

// Use a regex to match the exact insert block
const pcrRegex = /await sequelize\.query\(\r?\n\s*\`INSERT INTO pcr \([\s\S]*?\`,\r?\n\s*\{\r?\n\s*replacements: \{\r?\n\s*id,\r?\n\s*patientId: appt\.patient_id,\r?\n\s*therapistId,\r?\n\s*serviceTypeId: appt\.service_type_id\r?\n\s*\},\r?\n\s*type: QueryTypes\.INSERT,\r?\n\s*transaction: t\r?\n\s*\}\r?\n\s*\);/;

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

content = content.replace(pcrRegex, replacement1);

fs.writeFileSync(targetFile, content, 'utf8');
