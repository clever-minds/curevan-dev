const fs = require('fs');

// 1. Backend: appointmentsController.js - Add leave check to createBookingAndInvoice
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

const leaveCheckCode = `
    // Check if therapist is on leave
    if (bookingData.therapistId) {
      const [leaves] = await sequelize.query(
        \`SELECT 1 FROM therapist_leaves tl
         JOIN therapist_profiles tp ON tl.therapist_id = tp.id
         WHERE tp.user_id = :therapistId
           AND :bookingDate >= tl.start_date AND :bookingDate <= tl.end_date\`,
        {
          replacements: { therapistId: bookingData.therapistId, bookingDate: bookingData.date },
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );
      if (leaves) {
        await t.rollback();
        return res.status(400).json({ success: false, error: "Therapist is on leave on this date" });
      }
    }
`;

if (!content.includes('Check if therapist is on leave')) {
    const insertPoint = content.indexOf('// 1️⃣ Insert appointment');
    if (insertPoint > -1) {
        content = content.substring(0, insertPoint) + leaveCheckCode + '\n    ' + content.substring(insertPoint);
        fs.writeFileSync(controllerPath, content, 'utf8');
        console.log("Added leave check to createBookingAndInvoice");
    } else {
        console.log("Insert point not found");
    }
} else {
    console.log("Leave check already exists");
}
