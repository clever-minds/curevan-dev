const fs = require('fs');

const controllerPath = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const approveTargetStr = `    await t.commit();

    return res.status(200).json({ success: true, message: "Change request approved successfully" });`;

const approveReplacementStr = `    /* ---------- SEND NOTIFICATION ---------- */
    try {
      const [userRows] = await sequelize.query(
        \`SELECT uid FROM users WHERE id = :userId\`,
        { replacements: { userId: request.user_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
      );
      if (userRows && userRows.uid) {
        await sequelize.query(
          \`INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)\`,
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

    await t.commit();

    return res.status(200).json({ success: true, message: "Change request approved successfully" });`;

const rejectTargetStr = `    await sequelize.query(
      \`UPDATE change_requests
       SET status='rejected',
           reviewer_id=:admin,
           reviewed_at=NOW(),
           reason=:reason
       WHERE id=:id\`,
      {
        replacements: {
          id: requestId,
          admin: req.user.id,
          reason
        }
      }
    );

    return res.success({}, "Request rejected successfully");`;

const rejectReplacementStr = `    await sequelize.query(
      \`UPDATE change_requests
       SET status='rejected',
           reviewer_id=:admin,
           reviewed_at=NOW(),
           reason=:reason
       WHERE id=:id\`,
      {
        replacements: {
          id: requestId,
          admin: req.user.id,
          reason
        }
      }
    );

    /* ---------- SEND NOTIFICATION ---------- */
    try {
      const [reqRow] = await sequelize.query(
        \`SELECT user_id FROM change_requests WHERE id = :id\`,
        { replacements: { id: requestId }, type: sequelize.QueryTypes.SELECT }
      );
      if (reqRow && reqRow.user_id) {
        const [userRows] = await sequelize.query(
          \`SELECT uid FROM users WHERE id = :userId\`,
          { replacements: { userId: reqRow.user_id }, type: sequelize.QueryTypes.SELECT }
        );
        if (userRows && userRows.uid) {
          await sequelize.query(
            \`INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)\`,
            {
              replacements: {
                uid: userRows.uid,
                type: 'profile_update_rejected',
                title: 'Profile Update Rejected',
                message: \\\`Your profile changes were rejected. Reason: \${reason}\\\`,
                link: '/dashboard/account'
              }
            }
          );
        }
      }
    } catch (notifErr) {
      console.error("Failed to send PCR rejection notification:", notifErr);
    }

    return res.success({}, "Request rejected successfully");`;

code = code.replace(approveTargetStr, approveReplacementStr);
code = code.replace(rejectTargetStr, rejectReplacementStr);

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('usersController.js patched successfully for PCR approval/rejection notifications');
