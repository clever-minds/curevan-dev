const fs = require('fs');
const path = require('path');

const controllerCode = 'const { QueryTypes } = require("sequelize");\n' +
'const { sequelize } = require("../../config/db");\n\n' +
'exports.addLeave = async (req, res) => {\n' +
'  try {\n' +
'    const therapistId = req.user.id;\n' +
'    const { start_date, end_date, start_time, end_time, reason } = req.body;\n\n' +
'    if (!start_date || !end_date) {\n' +
'      return res.error("Start date and end date are required");\n' +
'    }\n\n' +
'    await sequelize.query(\n' +
'      "INSERT INTO therapist_leaves (therapist_id, start_date, end_date, start_time, end_time, reason, status) " +\n' +
'      "VALUES (:therapistId, :start_date, :end_date, :start_time, :end_time, :reason, \'approved\')",\n' +
'      {\n' +
'        replacements: { therapistId, start_date, end_date, start_time: start_time || null, end_time: end_time || null, reason: reason || null },\n' +
'        type: QueryTypes.INSERT,\n' +
'      }\n' +
'    );\n\n' +
'    return res.success(null, "Leave added successfully");\n' +
'  } catch (error) {\n' +
'    console.error(error);\n' +
'    return res.error("Failed to add leave");\n' +
'  }\n' +
'};\n\n' +
'exports.listLeaves = async (req, res) => {\n' +
'  try {\n' +
'    const therapistId = req.user.id;\n' +
'    const leaves = await sequelize.query(\n' +
'      "SELECT * FROM therapist_leaves WHERE therapist_id = :therapistId ORDER BY start_date DESC",\n' +
'      {\n' +
'        replacements: { therapistId },\n' +
'        type: QueryTypes.SELECT,\n' +
'      }\n' +
'    );\n\n' +
'    return res.success(leaves, "Leaves fetched successfully");\n' +
'  } catch (error) {\n' +
'    console.error(error);\n' +
'    return res.error("Failed to fetch leaves");\n' +
'  }\n' +
'};\n\n' +
'exports.deleteLeave = async (req, res) => {\n' +
'  try {\n' +
'    const therapistId = req.user.id;\n' +
'    const { id } = req.params;\n\n' +
'    const result = await sequelize.query(\n' +
'      "DELETE FROM therapist_leaves WHERE id = :id AND therapist_id = :therapistId RETURNING id",\n' +
'      {\n' +
'        replacements: { id, therapistId },\n' +
'        type: QueryTypes.DELETE,\n' +
'      }\n' +
'    );\n\n' +
'    if (!result.length) {\n' +
'      return res.error("Leave not found or unauthorized");\n' +
'    }\n\n' +
'    return res.success(null, "Leave deleted successfully");\n' +
'  } catch (error) {\n' +
'    console.error(error);\n' +
'    return res.error("Failed to delete leave");\n' +
'  }\n' +
'};\n';

const controllerPath = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistLeavesController.js';
fs.writeFileSync(controllerPath, controllerCode, 'utf8');
console.log('Controller created at', controllerPath);

const routesPath = 'C:\\curevan_node\\src\\routes\\therapist.routes.js';
let routesCode = fs.readFileSync(routesPath, 'utf8');

const leavesImport = 'const therapistLeavesController = require("../controllers/therapist/therapistLeavesController");\n';
if (!routesCode.includes('therapistLeavesController')) {
  routesCode = leavesImport + routesCode;
  
  const leavesRoutes = '\n// --- Leaves ---\n' +
'router.post("/leaves", authMiddleware, responseHandler, therapistLeavesController.addLeave);\n' +
'router.get("/leaves", authMiddleware, responseHandler, therapistLeavesController.listLeaves);\n' +
'router.delete("/leaves/:id", authMiddleware, responseHandler, therapistLeavesController.deleteLeave);\n';

  routesCode = routesCode.replace('module.exports = router;', leavesRoutes + '\nmodule.exports = router;');
  fs.writeFileSync(routesPath, routesCode, 'utf8');
  console.log('Routes patched at', routesPath);
} else {
  console.log('Routes already patched');
}
