const fs = require('fs');
const filePath = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = '{ replacements: { userId: request.user_id }, type: sequelize.QueryTypes.SELECT, transaction: t }';
const replace1 = '{ replacements: { userId: request.user_id }, type: sequelize.QueryTypes.SELECT }';
content = content.replace(target1, replace1);

const target2 = `          {
            replacements: {
              uid: userRows.uid,
              type: 'profile_update_approved',
              title: 'Profile Update Approved',
              message: 'Your profile changes have been reviewed and approved.',
              link: '/dashboard/account'
            },
            transaction: t
          }`;
const replace2 = `          {
            replacements: {
              uid: userRows.uid,
              type: 'profile_update_approved',
              title: 'Profile Update Approved',
              message: 'Your profile changes have been reviewed and approved.',
              link: '/dashboard/account'
            }
          }`;
content = content.replace(target2, replace2);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched usersController.js');
