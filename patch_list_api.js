const fs = require('fs');
const file = 'c:\\curevan_node\\src\\controllers\\notifications\\notificationsController.js';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('[BACKEND_NOTIFICATION_LIST]')) {
        content = content.replace('    res.json({', '    console.log(`[BACKEND_NOTIFICATION_LIST] Fetching for UID: ${uid}`);\n    console.log(`[BACKEND_NOTIFICATION_LIST] Data returned:`, notifications);\n\n    res.json({');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
    } else {
        console.log('Already patched');
    }
}
