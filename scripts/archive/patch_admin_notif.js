const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\therapist\\\\therapistController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const targetStr = `    await t.commit();

    try {
      await transporter.sendMail({`;

const replacementStr = `    // Notify Admins about new registration
    try {
      const admins = await sequelize.query(
        "SELECT u.id, u.uid FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('admin.super', 'admin.therapy')",
        { type: sequelize.QueryTypes.SELECT, transaction: t }
      );
      for (const admin of admins) {
        if (admin.id) {
          await sequelize.query("INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)",
            {
              replacements: {
                uid: String(admin.id),
                type: 'new_therapist_registration',
                title: 'New Therapist Registration',
                message: \`A new therapist (\${fullName || 'Therapist'}) has registered and is pending approval.\`,
                link: '/dashboard/admin/users'
              },
              transaction: t
            }
          );
        }
      }
    } catch(adminNotifErr) {
      console.error("Failed to notify admins of new registration:", adminNotifErr);
    }

    await t.commit();

    try {
      await transporter.sendMail({`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync(controllerPath, code, 'utf8');
    console.log("Successfully added admin notifications for new therapist registration");
} else {
    console.log("Could not find target string.");
}
