const fs = require('fs');

const path = 'c:/curevan_node/src/utils/firebaseNotifier.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "SELECT id FROM users WHERE fcm_token = :token",
  "SELECT uid FROM users WHERE fcm_token = :token"
);
code = code.replace(
  "if (user && user.id)",
  "if (user && user.uid)"
);
code = code.replace(
  "uid: user.id",
  "uid: user.uid"
);

fs.writeFileSync(path, code, 'utf8');
console.log('firebaseNotifier fixed user_uid bug');
