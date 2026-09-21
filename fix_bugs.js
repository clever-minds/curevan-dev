const fs = require('fs');

// 1. Backend: appointmentsController.js - Add leave check to createBookingAndInvoice
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

const leaveCheckCode = `
    // Check if therapist is on leave
    if (bookingData.therapistId) {
      const [leaves] = await sequelize.query(
        \`SELECT 1 FROM therapist_leaves tl
         JOIN therapist_profiles tp ON tl.therapist_id = tp.id
         WHERE tp.user_id = :therapistId
           AND :bookingDate >= tl.start_date AND :bookingDate <= tl.end_date\`,
        {
          replacements: { therapistId: bookingData.therapistId, bookingDate: bookingData.date },
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );
      if (leaves) {
        await t.rollback();
        return res.status(400).json({ success: false, error: "Therapist is on leave on this date" });
      }
    }

    // --------------------------
`;
if (!content.includes('Check if therapist is on leave') && content.includes('// 1️⃣ Insert appointment')) {
    content = content.replace('    // --------------------------\n    // 1️⃣ Insert appointment', leaveCheckCode + '    // 1️⃣ Insert appointment');
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log("Added leave check to createBookingAndInvoice");
}

// 2. Frontend: src/lib/repos/appointments.ts - Add rejectBookingRequest
const repoPath = 'c:\\\\Users\\\\ujjaw\\\\Downloads\\\\curevan-24-07-2026\\\\curevan-dev\\\\src\\\\lib\\\\repos\\\\appointments.ts';
let repoContent = fs.readFileSync(repoPath, 'utf8');
if (!repoContent.includes('export async function rejectBookingRequest')) {
    const rejectCode = `
/**
 * Reject a booking request
 */
export async function rejectBookingRequest(appointmentId: number): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing, please login again');

    const { data: response } = await serverApi.post<ApiResponse<any>>(
      \`/api/appointments/reject/\${appointmentId}\`,
      {},
      { headers: { Authorization: \`Bearer \${token}\` } }
    );
    return response?.success === true;
  } catch (err) {
    console.error('Error rejecting booking request:', err);
    return false;
  }
}
`;
    repoContent += rejectCode;
    fs.writeFileSync(repoPath, repoContent, 'utf8');
    console.log("Added rejectBookingRequest to frontend API");
}

// 3. Frontend: AppointmentsTable.tsx - Add Accept/Reject buttons
const tablePath = 'c:\\\\Users\\\\ujjaw\\\\Downloads\\\\curevan-24-07-2026\\\\curevan-dev\\\\src\\\\components\\\\admin\\\\AppointmentsTable.tsx';
let tableContent = fs.readFileSync(tablePath, 'utf8');

// Ensure accept/reject API is imported
if (!tableContent.includes('acceptBookingRequest')) {
    tableContent = tableContent.replace(
        "import { listAppointments, listAppointmentsForUser ,cancelAppointments} from '@/lib/repos/appointments';",
        "import { listAppointments, listAppointmentsForUser, cancelAppointments, acceptBookingRequest, rejectBookingRequest } from '@/lib/repos/appointments';"
    );
}

// Add user context to ActionsMenu for therapist details
if (!tableContent.includes('const { user } = useAuth();') && tableContent.includes('const ActionsMenu =')) {
    tableContent = tableContent.replace(
        "const { toast } = useToast();",
        "const { toast } = useToast();\n  const { user } = useAuth();"
    );
}

// Add handleAccept and handleReject
if (!tableContent.includes('handleAcceptRequest')) {
    const cancelCode = 'const handleCancelAppointment = async () => {';
    const acceptRejectCode = `
    const handleAcceptRequest = async () => {
        if (!user) return;
        try {
            setLoading(true);
            await acceptBookingRequest(appointment.id, { therapistId: user.id, therapistName: user.name, therapistPhone: user.phone });
            toast({ title: 'Accepted', description: 'Booking request accepted.' });
            window.location.reload();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to accept booking request.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleRejectRequest = async () => {
        try {
            setLoading(true);
            await rejectBookingRequest(appointment.id);
            toast({ title: 'Rejected', description: 'Booking request rejected.' });
            window.location.reload();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to reject booking request.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };
`;
    tableContent = tableContent.replace(cancelCode, acceptRejectCode + '\n' + cancelCode);
}

// Add to dropdown items
if (!tableContent.includes('handleAcceptRequest}')) {
    const dropdownPay = `{isPatient && appointment.status === 'Payment Pending' && (`;
    const dropdownAcceptReject = `{isTherapist && (appointment.status === 'Pending Approval' || appointment.status === 'Pending') && (
            <>
                <DropdownMenuItem className="text-green-600 focus:text-green-600" onClick={handleAcceptRequest}><PlayCircle className="mr-2" /> Accept</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleRejectRequest}><Ban className="mr-2" /> Reject</DropdownMenuItem>
            </>
        )}\n        {isPatient && appointment.status === 'Payment Pending' && (`
    tableContent = tableContent.replace(dropdownPay, dropdownAcceptReject);

    // Add to sheet items
    const sheetPay = `{isPatient && appointment.status === 'Payment Pending' && (`;
    const sheetAcceptReject = `{isTherapist && (appointment.status === 'Pending Approval' || appointment.status === 'Pending') && (
             <>
                <Button variant="outline" className="w-full justify-start text-green-600" onClick={handleAcceptRequest}><PlayCircle className="mr-2" /> Accept</Button>
                <Button variant="destructive" className="w-full justify-start" onClick={handleRejectRequest}><Ban className="mr-2" /> Reject</Button>
             </>
          )}\n             {isPatient && appointment.status === 'Payment Pending' && (`
    tableContent = tableContent.replace(sheetPay, sheetAcceptReject);
    
    fs.writeFileSync(tablePath, tableContent, 'utf8');
    console.log("Added Accept/Reject buttons to AppointmentsTable.tsx");
}

