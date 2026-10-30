const fs = require('fs');

const targetFile = 'c:/curevan_node/src/utils/firebaseNotifier.js';
let content = fs.readFileSync(targetFile, 'utf8');

const importStatement = `const { getMessaging } = require("firebase-admin/messaging");`;
const newImports = `const { getMessaging } = require("firebase-admin/messaging");
const { sequelize } = require("../config/db");

const saveNotification = async (token, title, body, data) => {
  try {
    const [user] = await sequelize.query('SELECT id FROM users WHERE fcm_token = :token LIMIT 1', { replacements: { token }, type: sequelize.QueryTypes.SELECT });
    if (user && user.id) {
      await sequelize.query('INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)', { replacements: { uid: user.id, type: data?.type || 'system', title: title || '', message: body || '', link: data?.link || '' } });
    }
  } catch (err) { console.error('Error saving notification to db:', err); }
};
`;

if (!content.includes('saveNotification')) {
  content = content.replace(importStatement, newImports);

  const singleSendLog = `console.log("Successfully sent notification to therapist:", response);`;
  const singleSendNew = `console.log("Successfully sent notification to therapist:", response);\n    await saveNotification(token, title, body, data);`;
  content = content.replace(singleSendLog, singleSendNew);

  const multiSendLog = `console.log("Successfully sent multicast notification:", response.successCount, "successes,", response.failureCount, "failures");`;
  const multiSendNew = `console.log("Successfully sent multicast notification:", response.successCount, "successes,", response.failureCount, "failures");\n    for (const t of tokens) {\n      await saveNotification(t, title, body, data);\n    }`;
  content = content.replace(multiSendLog, multiSendNew);

  fs.writeFileSync(targetFile, content);
  console.log('firebaseNotifier patched successfully.');
} else {
  console.log('firebaseNotifier already patched.');
}
