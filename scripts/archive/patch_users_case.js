const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
let c = fs.readFileSync(path, 'utf8');

const t1 = `        SELECT
          cr.id,
          cr.user_id,
          cr.role,
          cr.entity_id,
          cr.section,
          cr.changes,
          cr.reason,       -- added reason field
          cr.status,
          cr.reviewer_id,
          cr.created_at,
          cr.reviewed_at,
          u.name,
          u.email,
          u.state_admin_name AS state
        FROM change_requests cr`;

const r1 = `        SELECT
          cr.id,
          cr.user_id AS "userId",
          cr.role,
          cr.entity_id AS "entityId",
          cr.section,
          cr.changes,
          cr.reason,       -- added reason field
          cr.status,
          cr.reviewer_id AS "reviewerId",
          cr.created_at AS "createdAt",
          cr.reviewed_at AS "reviewedAt",
          u.name,
          u.email,
          u.state_admin_name AS state
        FROM change_requests cr`;

const t2 = `        SELECT
          cr.id,
          cr.user_id,
          cr.role,
          cr.entity_id,
          cr.section,
          cr.changes,
          cr.status,
          cr.reviewer_id,
          cr.created_at,
          cr.reviewed_at,
          u.name,
          u.email,
          u.state_admin_name AS state
        FROM change_requests cr`;

const r2 = `        SELECT
          cr.id,
          cr.user_id AS "userId",
          cr.role,
          cr.entity_id AS "entityId",
          cr.section,
          cr.changes,
          cr.status,
          cr.reviewer_id AS "reviewerId",
          cr.created_at AS "createdAt",
          cr.reviewed_at AS "reviewedAt",
          u.name,
          u.email,
          u.state_admin_name AS state
        FROM change_requests cr`;

if (c.includes(t1)) {
  c = c.replace(t1, r1);
  console.log("Patched getChangeRequestById");
} else {
  console.log("Failed to patch getChangeRequestById");
}

if (c.includes(t2)) {
  c = c.replace(t2, r2);
  console.log("Patched listChangeRequests");
} else {
  console.log("Failed to patch listChangeRequests");
}

fs.writeFileSync(path, c, 'utf8');
