const fs = require('fs');
const filePath = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `          "SELECT uid FROM users WHERE id = :userId",
          { replacements: { userId: reqRow.user_id }, type: sequelize.QueryTypes.SELECT, transaction: t }`;
const replace1 = `          "SELECT uid FROM users WHERE id = :userId",
          { replacements: { userId: reqRow.user_id }, type: sequelize.QueryTypes.SELECT }`;

const target2 = `          {
            replacements: {
              uid: userRows.uid,
              type: 'profile_update_rejected',
              title: 'Profile Update Rejected',
              message: \`Your profile changes were rejected. Reason: \${reason}\`,
              link: '/dashboard/account'
            },
            transaction: t
          }`;
const replace2 = `          {
            replacements: {
              uid: userRows.uid,
              type: 'profile_update_rejected',
              title: 'Profile Update Rejected',
              message: \`Your profile changes were rejected. Reason: \${reason}\`,
              link: '/dashboard/account'
            }
          }`;

if (content.includes('transaction: t') && content.includes('profile_update_rejected')) {
  content = content.replace(target2, replace2);
  // target1 may not have transaction: t, because earlier I noticed it was missing
  content = content.replace(target1, replace1); 
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched rejectChangeRequest in usersController.js');
} else {
  console.log('Already patched or targets not found.');
}
