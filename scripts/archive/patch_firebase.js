const fs = require('fs');

const path = 'c:/curevan_node/src/utils/firebaseNotifier.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'INSERT INTO notifications (user_uid, title, message, type, is_read, created_at, updated_at)',
  'INSERT INTO notifications (user_uid, title, message, type, is_read, created_at)'
);

code = code.replace(
  'VALUES (:userUid, :title, :message, :type, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
  'VALUES (:userUid, :title, :message, :type, false, CURRENT_TIMESTAMP)'
);

fs.writeFileSync(path, code, 'utf8');
console.log('firebaseNotifier.js patched!');
