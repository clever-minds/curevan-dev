const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\therapist\\\\therapistController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const targetStr = `    const hash = await bcrypt.hash(password, 10);
    const uid = uuidv4();
    const verificationToken = uuidv4();`;

const replacementStr = `    const exists = await sequelize.query(
      \`SELECT id FROM users WHERE email = :email\`,
      { replacements: { email }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (exists.length) {
      await t.rollback();
      return res.status(409).json({ status: false, message: 'A user with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const uid = uuidv4();
    const verificationToken = uuidv4();`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync(controllerPath, code, 'utf8');
    console.log("Successfully added email existence check to registerTherapist");
} else {
    console.log("Could not find target string.");
}
