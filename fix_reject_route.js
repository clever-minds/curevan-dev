const fs = require('fs');

const routePath = 'C:\\\\curevan_node\\\\src\\\\routes\\\\appointments.routes.js';
let routeContent = fs.readFileSync(routePath, 'utf8');

if (!routeContent.includes('appointmentsController.rejectBookingRequest')) {
    routeContent = routeContent.replace(
        '// ✅ POST accept booking request\nrouter.post("/accept/:id", authMiddleware, responseHandler, appointmentsController.acceptBookingRequest);',
        '// ✅ POST accept booking request\nrouter.post("/accept/:id", authMiddleware, responseHandler, appointmentsController.acceptBookingRequest);\n\n// ✅ POST reject booking request\nrouter.post("/reject/:id", authMiddleware, responseHandler, appointmentsController.rejectBookingRequest);'
    );
    fs.writeFileSync(routePath, routeContent, 'utf8');
    console.log("Added rejectBookingRequest route");
} else {
    console.log("Route already exists");
}
