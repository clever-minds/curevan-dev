const fs = require('fs');
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

try {
    let content = fs.readFileSync(controllerPath, 'utf8');
    let originalContent = content;

    // 1. Fix acceptBookingRequest
    const acceptStart = content.indexOf('exports.acceptBookingRequest = async (req, res) => {');
    const rejectStart = content.indexOf('// ✅ 3b. REJECT BOOKING REQUEST');

    if (acceptStart !== -1 && rejectStart !== -1) {
        let acceptLogic = content.substring(acceptStart, rejectStart);
        
        // Update the INSERT INTO pcr block to check if it exists first
        const insertPcrTarget = `await sequelize.query(
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

        const insertPcrReplacement = `const [pcrExists] = await sequelize.query(
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

        // Also fix the error logging in accept
        const acceptErrorTarget = `return res.status(500).json({ success: false, error: "Failed to accept booking" });`;
        const acceptErrorReplacement = `return res.status(500).json({ success: false, error: "Failed to accept booking: " + error.message });`;

        acceptLogic = acceptLogic.replace(insertPcrTarget, insertPcrReplacement);
        acceptLogic = acceptLogic.replace(acceptErrorTarget, acceptErrorReplacement);
        
        content = content.substring(0, acceptStart) + acceptLogic + content.substring(rejectStart);
    } else {
        console.log("Could not find accept/reject boundaries.");
    }

    // 2. Fix rejectBookingRequest
    const rejectErrorConditionTarget = `if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ success: false, error: \`Invalid appointment or unauthorized. appt: \${!!appt}, status: \${appt?.status}, therapist_id: \${appt?.therapist_id}, userId: \${userId}\` });
    }`;
    const rejectErrorConditionTargetFallback = `if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ success: false, error: "Invalid appointment or unauthorized" });
    }`;

    const rejectErrorConditionReplacement = `if (!appt) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }
    
    if ((appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ 
        success: false, 
        error: \`Invalid appointment or unauthorized. status: \${appt.status}, therapist_id: \${appt.therapist_id}, userId: \${userId}\` 
      });
    }`;

    if (content.includes(rejectErrorConditionTarget)) {
        content = content.replace(rejectErrorConditionTarget, rejectErrorConditionReplacement);
    } else if (content.includes(rejectErrorConditionTargetFallback)) {
        content = content.replace(rejectErrorConditionTargetFallback, rejectErrorConditionReplacement);
    }

    if (content !== originalContent) {
        fs.writeFileSync(controllerPath, content, 'utf8');
        console.log("Successfully patched accept/reject logic in appointmentsController.js!");
    } else {
        console.log("No changes made. The file might already be patched or targets not found.");
    }
} catch (error) {
    console.error("Error patching file:", error);
}
