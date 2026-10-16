const fs = require('fs');
const routesPath = 'C:\\\\curevan_node\\\\src\\\\routes\\\\appointments.routes.js';

try {
    let content = fs.readFileSync(routesPath, 'utf8');
    
    if (!content.includes('router.post("/reject/:id"')) {
        const target = 'router.post("/accept/:id", authMiddleware, responseHandler, appointmentsController.acceptBookingRequest);';
        const replacement = target + '\n\n// ✅ POST reject booking request\nrouter.post("/reject/:id", authMiddleware, responseHandler, appointmentsController.rejectBookingRequest);';
        
        content = content.replace(target, replacement);
        fs.writeFileSync(routesPath, content, 'utf8');
        console.log("Added /reject/:id route successfully!");
    } else {
        console.log("/reject/:id route already exists.");
    }
} catch (err) {
    console.error("Error updating routes:", err);
}
