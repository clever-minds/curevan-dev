const fs = require('fs');

const controllerPath = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistLeavesController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

// Update addLeave to fetch therapist profile ID
code = code.replace(
  `    const therapistId = req.user.id;
    const { start_date, end_date, start_time, end_time, reason } = req.body;`,
  `    const userId = req.user.id;
    const { start_date, end_date, start_time, end_time, reason } = req.body;

    const [profile] = await sequelize.query(
      "SELECT id FROM therapist_profiles WHERE user_id = :userId",
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    if (!profile) return res.error("Therapist profile not found");
    const therapistId = profile.id;`
);

// Update listLeaves
code = code.replace(
  `    const therapistId = req.user.id;
    const leaves = await sequelize.query(
      "SELECT * FROM therapist_leaves WHERE therapist_id = :therapistId ORDER BY start_date DESC",`,
  `    const userId = req.user.id;
    const [profile] = await sequelize.query(
      "SELECT id FROM therapist_profiles WHERE user_id = :userId",
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    if (!profile) return res.success([], "No leaves found");
    const therapistId = profile.id;
    
    const leaves = await sequelize.query(
      "SELECT * FROM therapist_leaves WHERE therapist_id = :therapistId ORDER BY start_date DESC",`
);

// Update deleteLeave
code = code.replace(
  `    const therapistId = req.user.id;
    const { id } = req.params;`,
  `    const userId = req.user.id;
    const { id } = req.params;

    const [profile] = await sequelize.query(
      "SELECT id FROM therapist_profiles WHERE user_id = :userId",
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    if (!profile) return res.error("Therapist profile not found");
    const therapistId = profile.id;`
);

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('therapistLeavesController.js patched successfully');
