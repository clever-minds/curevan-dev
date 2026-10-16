const fs = require('fs');
const path = 'C:\\curevan_node\\src\\app.js';
let content = fs.readFileSync(path, 'utf8');
if (!content.includes('err instanceof SyntaxError')) {
  content = content.replace(
    'app.use(express.json({ limit: "600mb" }));',
    'app.use(express.json({ limit: "600mb" }));\napp.use((err, req, res, next) => {\n  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {\n    console.error("[Error] Invalid JSON from " + req.ip + " to " + req.originalUrl + ":", err.message);\n    return res.status(400).send({ success: false, message: "Invalid JSON format" });\n  }\n  next(err);\n});'
  );
  fs.writeFileSync(path, content);
  console.log("Patched successfully!");
} else {
  console.log("Already patched.");
}
