const fs = require('fs');
const path = require('path');

const cronJsPath = 'C:\\curevan_node\\src\\cron.js';
const controllerPath = 'C:\\curevan_node\\src\\controllers\\general\\generalController.js';

// Update cron.js
let cronContent = fs.readFileSync(cronJsPath, 'utf8');
cronContent = cronContent.replace(
  /WHERE status = 'pending_review'/g,
  "WHERE status = 'scheduled'"
);
fs.writeFileSync(cronJsPath, cronContent);
console.log('Patched cron.js');

// Update generalController.js
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

const oldControllerBlock = `    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Knowledge Base ID required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    await sequelize.query(
      \`
      UPDATE knowledge_base
      SET
        status = :status,
        updated_at = :updatedAt,
        published_at = CASE WHEN :status = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END
      WHERE id = :id
      \`,
      {
        replacements: {
          id,
          status,
          updatedAt: new Date(),
        },
        type: QueryTypes.UPDATE,
      }`;

const newControllerBlock = `    const { status, publishedAt } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Knowledge Base ID required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    let publishedAtVal = null;
    if (status === 'published' && !publishedAt) {
      publishedAtVal = new Date();
    } else if (publishedAt) {
      publishedAtVal = new Date(publishedAt);
    }

    let updateQuery = \`
      UPDATE knowledge_base
      SET
        status = :status,
        updated_at = :updatedAt
    \`;

    if (publishedAtVal) {
      updateQuery += \`, published_at = :publishedAt \`;
    }

    updateQuery += \` WHERE id = :id\`;

    await sequelize.query(updateQuery, {
      replacements: {
        id,
        status,
        updatedAt: new Date(),
        publishedAt: publishedAtVal
      },
      type: QueryTypes.UPDATE,
    }`;

if (controllerContent.includes(oldControllerBlock)) {
    controllerContent = controllerContent.replace(oldControllerBlock, newControllerBlock);
    fs.writeFileSync(controllerPath, controllerContent);
    console.log('Patched generalController.js');
} else {
    console.log('Failed to patch generalController.js: block not found');
}
