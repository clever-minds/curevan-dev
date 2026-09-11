const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\general\\generalController.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '        published_at = :publishedAt,\n        updated_at = :updatedAt',
  "        published_at = CASE WHEN :status = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE COALESCE(:publishedAt, published_at) END,\n        updated_at = :updatedAt"
);

fs.writeFileSync(path, content);
console.log('Patched updateKnowledgeBase successfully!');
