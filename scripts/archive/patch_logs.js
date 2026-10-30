const fs = require('fs');
const filePath = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `    /* ---------- SEND NOTIFICATION ---------- */
    try {
      const [userRows] = await sequelize.query(
        "SELECT uid, fcm_token FROM users WHERE id = :userId",
        { replacements: { userId: request.user_id }, type: sequelize.QueryTypes.SELECT }
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
            }
          }
        );
        if (userRows.fcm_token) {
          firebaseNotifier.sendToTherapist(userRows.fcm_token, 'Profile Update Approved', 'Your profile changes have been reviewed and approved.').catch(e => {});
        }
      }
    } catch (notifErr) {
      console.error("Failed to send PCR approval notification:", notifErr);
    }`;

const replace = `    /* ---------- SEND NOTIFICATION ---------- */
    try {
      console.log("SEND NOTIFICATION TRIGGERED for request:", request);
      const [userRows] = await sequelize.query(
        "SELECT uid, fcm_token FROM users WHERE id = :userId",
        { replacements: { userId: request.user_id }, type: sequelize.QueryTypes.SELECT }
      );
      console.log("USER ROWS:", userRows);
      if (userRows && userRows.uid) {
        console.log("INSERTING NOTIFICATION FOR UID:", userRows.uid);
        await sequelize.query(
          "INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)",
          {
            replacements: {
              uid: userRows.uid,
              type: 'profile_update_approved',
              title: 'Profile Update Approved',
              message: 'Your profile changes have been reviewed and approved.',
              link: '/dashboard/account'
            }
          }
        );
        console.log("NOTIFICATION INSERTED SUCCESSFULLY");
        if (userRows.fcm_token) {
          console.log("SENDING FCM TO:", userRows.fcm_token);
          firebaseNotifier.sendToTherapist(userRows.fcm_token, 'Profile Update Approved', 'Your profile changes have been reviewed and approved.').catch(e => {
            console.error("FCM SEND ERROR:", e);
          });
        }
      } else {
        console.log("NO USER UID FOUND TO SEND NOTIFICATION");
      }
    } catch (notifErr) {
      console.error("Failed to send PCR approval notification:", notifErr);
    }`;

content = content.replace(target, replace);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched logs into usersController.js');
