const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [search, replace] of replacements) {
        content = content.replaceAll(search, replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched ${filePath}`);
    } else {
        console.log(`No changes needed in ${filePath}`);
    }
}

const baseDir = 'c:\\curevan_node';

// 1. firebaseNotifier.js
replaceInFile(path.join(baseDir, 'src/utils/firebaseNotifier.js'), [
    ["SELECT uid FROM users WHERE fcm_token = :token LIMIT 1", "SELECT id, uid FROM users WHERE fcm_token = :token LIMIT 1"],
    ["if (user && user.uid) {", "if (user && user.id) {"],
    ["uid: user.uid, type:", "uid: String(user.id), type:"]
]);

// 2. usersController.js
replaceInFile(path.join(baseDir, 'src/controllers/users/usersController.js'), [
    ["SELECT uid, fcm_token FROM users WHERE id = :userId", "SELECT id, uid, fcm_token FROM users WHERE id = :userId"],
    ["if (userRows && userRows.uid) {", "if (userRows && userRows.id) {"],
    ["console.log(\"INSERTING NOTIFICATION FOR UID:\", userRows.uid);", "console.log(\"INSERTING NOTIFICATION FOR UID:\", userRows.id);"],
    ["uid: userRows.uid,", "uid: String(userRows.id),"]
]);

// 3. authController.js
replaceInFile(path.join(baseDir, 'src/controllers/auth/authController.js'), [
    ["SELECT u.uid FROM users u", "SELECT u.id, u.uid FROM users u"],
    ["const userUid = userRows.uid;", "const userUid = String(userRows.id);"],
    ["for (const admin of admins) {", "for (const admin of admins) {"], // just marker
    ["if (admin.uid) {", "if (admin.id) {"],
    ["uid: admin.uid,", "uid: String(admin.id),"]
]);

// 4. notifications.routes.js
replaceInFile(path.join(baseDir, 'src/routes/notifications.routes.js'), [
    ["/list/:uid", "/list/:id"]
]);

// 5. notificationsController.js
replaceInFile(path.join(baseDir, 'src/controllers/notifications/notificationsController.js'), [
    ["const { uid } = req.params;", "const { id } = req.params; const uid = String(id);"],
    ["Fetching for UID: ${uid}", "Fetching for ID: ${uid}"]
]);

console.log('Backend patched.');
