const fs = require('fs');
const path = require('path');

async function patchBackend() {
  const backendDir = 'c:/curevan_node/src';

  const routesDir = path.join(backendDir, 'routes');
  const controllersDir = path.join(backendDir, 'controllers', 'notifications');

  if (!fs.existsSync(controllersDir)) {
    fs.mkdirSync(controllersDir, { recursive: true });
  }

  // 1. Create notifications controller
  const controllerContent = [
    'const { QueryTypes } = require("sequelize");',
    'const { sequelize } = require("../../config/db");',
    '',
    'exports.listNotifications = async (req, res) => {',
    '  try {',
    '    const { uid } = req.params;',
    '',
    '    const notifications = await sequelize.query(',
    '      `SELECT ',
    '        id, ',
    '        type, ',
    '        title, ',
    '        message, ',
    '        is_read as read, ',
    '        link, ',
    '        created_at as "createdAt"',
    '       FROM notifications',
    '       WHERE user_uid = :uid',
    '       ORDER BY created_at DESC',
    '       LIMIT 50`,',
    '      {',
    '        replacements: { uid },',
    '        type: QueryTypes.SELECT',
    '      }',
    '    );',
    '',
    '    res.json({',
    '      status: true,',
    '      data: notifications',
    '    });',
    '  } catch (error) {',
    '    console.error("listNotifications error:", error);',
    '    res.status(500).json({ status: false, message: "Server error" });',
    '  }',
    '};'
  ].join('\n');
  
  fs.writeFileSync(path.join(controllersDir, 'notificationsController.js'), controllerContent);

  // 2. Create routes file
  const routesContent = [
    'const express = require("express");',
    'const router = express.Router();',
    'const notificationsController = require("../controllers/notifications/notificationsController");',
    'const authMiddleware = require("../middlewares/authMiddleware");',
    '',
    'router.get("/list/:uid", authMiddleware, notificationsController.listNotifications);',
    '',
    'module.exports = router;'
  ].join('\n');
  
  fs.writeFileSync(path.join(routesDir, 'notifications.routes.js'), routesContent);

  // 3. Patch app.js
  const appJsPath = path.join(backendDir, 'app.js');
  let appJsContent = fs.readFileSync(appJsPath, 'utf8');

  if (!appJsContent.includes("'/api/notifications'")) {
    appJsContent = appJsContent.replace(
      "app.use('/api/therapists', require('./routes/therapist.routes'));",
      "app.use('/api/therapists', require('./routes/therapist.routes'));\napp.use('/api/notifications', require('./routes/notifications.routes'));"
    );
    fs.writeFileSync(appJsPath, appJsContent);
  }

  // 4. Create database table
  const { sequelize } = require('c:/curevan_node/src/config/db.js');
  const createTableQuery = [
    'CREATE TABLE IF NOT EXISTS notifications (',
    '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
    '  user_uid VARCHAR(255) NOT NULL,',
    '  type VARCHAR(100),',
    '  title VARCHAR(255) NOT NULL,',
    '  message TEXT,',
    '  is_read BOOLEAN DEFAULT false,',
    '  link VARCHAR(255),',
    '  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
    ');'
  ].join('\n');

  try {
    await sequelize.query(createTableQuery);
    console.log("Notifications table created successfully!");
  } catch (err) {
    console.error("Failed to create table:", err);
  } finally {
    process.exit(0);
  }
}

patchBackend();
