const fs = require('fs');
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

const regex = /status = \'Accepted\'/g;
if (content.match(regex)) {
    // Only replace inside acceptBookingRequest
    const startIndex = content.indexOf('exports.acceptBookingRequest');
    const endIndex = content.indexOf('exports.rejectBookingRequest');
    
    let acceptContent = content.substring(startIndex, endIndex);
    acceptContent = acceptContent.replace(/status = \'Accepted\'/g, "status = CASE WHEN status = 'Pending Approval' THEN 'Payment Pending' ELSE 'Payment Pending' END");
    
    content = content.substring(0, startIndex) + acceptContent + content.substring(endIndex);
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log("Successfully updated status to Payment Pending");
} else {
    console.log("Target not found!");
}
