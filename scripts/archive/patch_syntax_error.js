const fs = require('fs');
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\therapist\\\\therapistController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

code = code.replace(
  '// exports.listUsersWithProfilesInRadius = async (req, res) => {\r\n  try {\r\n    const { lat, lng } = req.query;',
  'exports.listUsersWithProfilesInRadius = async (req, res) => {\r\n  try {\r\n    const { lat, lng } = req.query;'
);

code = code.replace(
  '// exports.listUsersWithProfilesInRadius = async (req, res) => {\n  try {\n    const { lat, lng } = req.query;',
  'exports.listUsersWithProfilesInRadius = async (req, res) => {\n  try {\n    const { lat, lng } = req.query;'
);

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('Fixed syntax error');
