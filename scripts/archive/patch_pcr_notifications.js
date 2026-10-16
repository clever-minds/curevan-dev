const fs = require('fs');

const controllerPath = 'C:\\curevan_node\\src\\controllers\\auth\\authController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const targetStr = `    await sequelize.query(
      \`INSERT INTO change_requests
       (user_id, role, entity_id, section, changes)
       VALUES (:user_id, :role, :entity_id, :section, :changes)\`,
      {
        replacements: {
          user_id: userId,
          role,
          entity_id: userId,
          section,
          changes: JSON.stringify(changes)
        }
      }
    );

    return res.success(changes, "Change request submitted successfully");`;

const replacementStr = `    await sequelize.query(
      \`INSERT INTO change_requests
       (user_id, role, entity_id, section, changes)
       VALUES (:user_id, :role, :entity_id, :section, :changes)\`,
      {
        replacements: {
          user_id: userId,
          role,
          entity_id: userId,
          section,
          changes: JSON.stringify(changes)
        }
      }
    );

    /* ---------- Send Notifications ---------- */
    try {
      const userRows = await sequelize.query(
        \`SELECT uid, name FROM users WHERE id = :userId\`,
        { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
      );
      if (userRows && userRows.length > 0) {
        const userUid = userRows[0].uid;
        const userName = userRows[0].name || 'Therapist';

        // Notify Therapist
        if (userUid) {
          await sequelize.query(
            \`INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)\`,
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
        }

        // Notify Admins
        const admins = await sequelize.query(
          \`SELECT uid FROM users WHERE role = 'admin'\`,
          { type: sequelize.QueryTypes.SELECT }
        );
        for (const admin of admins) {
          if (admin.uid) {
            await sequelize.query(
              \`INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)\`,
              {
                replacements: {
                  uid: admin.uid,
                  type: 'profile_update_request',
                  title: 'New Profile Update Request',
                  message: \\\`Therapist \${userName} has requested a profile update.\\\`,
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

    return res.success(changes, "Change request submitted successfully");`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('authController.js patched successfully for PCR notifications');
