const fs = require('fs');

function robustReplace(filePath, searchMarker, insertCode) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(searchMarker)) {
        console.error("Could not find marker in " + filePath);
        return;
    }
    // Replace just once
    content = content.replace(searchMarker, insertCode + "\n" + searchMarker);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully patched " + filePath);
}

// 1. authController.js
const authPath = 'C:\\curevan_node\\src\\controllers\\auth\\authController.js';
const authMarker = 'return res.success(changes, "Change request submitted successfully");';
const authInsert = `
    /* ---------- Send Notifications ---------- */
    try {
      const [userRows] = await sequelize.query(
        "SELECT uid, name FROM users WHERE id = :userId",
        { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
      );
      if (userRows && userRows.uid) {
        const userUid = userRows.uid;
        const userName = userRows.name || 'Therapist';

        // Notify Therapist
        await sequelize.query(
          "INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)",
          {
            replacements: {
              uid: userUid,
              type: 'profile_update',
              title: 'Profile Update Requested',
              message: 'Your profile update request has been submitted successfully and is pending approval.',
              link: '/dashboard/therapist/profile'
            }
          }
        );

        // Notify Admins
        const admins = await sequelize.query(
          "SELECT uid FROM users WHERE role = 'admin'",
          { type: sequelize.QueryTypes.SELECT }
        );
        for (const admin of admins) {
          if (admin.uid) {
            await sequelize.query(
              "INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)",
              {
                replacements: {
                  uid: admin.uid,
                  type: 'profile_update_request',
                  title: 'New Profile Update Request',
                  message: \`Therapist \${userName} has requested a profile update.\`,
                  link: '/dashboard/admin/profile-approvals'
                }
              }
            );
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to send PCR notifications:", notifErr);
    }
`;

// 2. usersController.js (approve)
const usersPath = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
const usersApproveMarker = 'return res.status(200).json({ success: true, message: "Change request approved successfully" });';
const usersApproveInsert = `
    /* ---------- SEND NOTIFICATION ---------- */
    try {
      const [userRows] = await sequelize.query(
        "SELECT uid FROM users WHERE id = :userId",
        { replacements: { userId: request.user_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
      );
      if (userRows && userRows.uid) {
        await sequelize.query(
          "INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)",
          {
            replacements: {
              uid: userRows.uid,
              type: 'profile_update_approved',
              title: 'Profile Update Approved',
              message: 'Your profile changes have been reviewed and approved.',
              link: '/dashboard/account'
            },
            transaction: t
          }
        );
      }
    } catch (notifErr) {
      console.error("Failed to send PCR approval notification:", notifErr);
    }
`;

// 3. usersController.js (reject)
const usersRejectMarker = 'return res.success({}, "Request rejected successfully");';
const usersRejectInsert = `
    /* ---------- SEND NOTIFICATION ---------- */
    try {
      const [reqRow] = await sequelize.query(
        "SELECT user_id FROM change_requests WHERE id = :id",
        { replacements: { id: requestId }, type: sequelize.QueryTypes.SELECT }
      );
      if (reqRow && reqRow.user_id) {
        const [userRows] = await sequelize.query(
          "SELECT uid FROM users WHERE id = :userId",
          { replacements: { userId: reqRow.user_id }, type: sequelize.QueryTypes.SELECT }
        );
        if (userRows && userRows.uid) {
          await sequelize.query(
            "INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)",
            {
              replacements: {
                uid: userRows.uid,
                type: 'profile_update_rejected',
                title: 'Profile Update Rejected',
                message: \`Your profile changes were rejected. Reason: \${reason}\`,
                link: '/dashboard/account'
              }
            }
          );
        }
      }
    } catch (notifErr) {
      console.error("Failed to send PCR rejection notification:", notifErr);
    }
`;

let content = fs.readFileSync(authPath, 'utf8');
if (!content.includes('/* ---------- Send Notifications ---------- */')) {
  robustReplace(authPath, authMarker, authInsert);
} else {
  console.log("authController already patched.");
}

content = fs.readFileSync(usersPath, 'utf8');
if (!content.includes('/* ---------- SEND NOTIFICATION ---------- */')) {
  robustReplace(usersPath, usersApproveMarker, usersApproveInsert);
  robustReplace(usersPath, usersRejectMarker, usersRejectInsert);
} else {
  console.log("usersController already patched.");
}
