const fs = require('fs');

const frontendPath = 'c:\\\\Users\\\\ujjaw\\\\Downloads\\\\curevan-24-07-2026\\\\curevan-dev\\\\src\\\\components\\\\admin\\\\AppointmentsTable.tsx';
let content = fs.readFileSync(frontendPath, 'utf8');

if (!content.includes('import useRazorpay')) {
    content = content.replace(
        "import { ReviewDialog } from '@/components/patient/ReviewDialog';",
        "import { ReviewDialog } from '@/components/patient/ReviewDialog';\nimport useRazorpay from '@/hooks/use-razorpay';\nimport serverApi from '@/lib/repos/axios.server';\nimport { getToken } from '@/lib/auth';"
    );
    console.log("Added useRazorpay import");
}

if (!content.includes('const { isLoaded, openPayment } = useRazorpay();')) {
    const actionMenuRegex = /const ActionsMenu = \([^)]+\) => \{/;
    content = content.replace(actionMenuRegex, (match) => {
        return match + `\n  const { isLoaded, openPayment } = useRazorpay();`;
    });
    console.log("Added useRazorpay hook to ActionsMenu");
}

if (!content.includes('handlePayNow')) {
    const handleCancelIndex = content.indexOf('const handleCancelAppointment');
    const handlePayNow = `
    const handlePayNow = () => {
        openPayment({
            amount: (appointment.totalAmount || appointment.serviceAmount || 0) * 100,
            currency: 'INR',
            receipt: \`receipt_booking_\${appointment.id}_\${Date.now()}\`,
            productName: \`Session with \${appointment.therapist}\`,
            productDescription: \`A \${appointment.therapyType} session on \${formatDateSafe(appointment.date)} at \${appointment.time}.\`,
            prefill: { name: appointment.patientName || 'Patient' },
            onSuccess: async (paymentResponse) => {
                try {
                    setLoading(true);
                    const token = await getToken();
                    const { data: res } = await serverApi.post(
                        \`/api/appointments/\${appointment.id}/pay\`,
                        { paymentId: paymentResponse.razorpay_payment_id, gateway: 'razorpay' },
                        { headers: { Authorization: \`Bearer \${token}\` } }
                    );
                    if (res?.success) {
                        toast({ title: 'Payment Successful', description: 'Your appointment is now confirmed.' });
                        window.location.reload();
                    } else {
                        toast({ title: 'Error', description: 'Failed to confirm payment on server.', variant: 'destructive' });
                    }
                } catch (e) {
                    toast({ title: 'Error', description: 'Failed to confirm payment.', variant: 'destructive' });
                } finally {
                    setLoading(false);
                }
            },
        });
    };
`;
    content = content.substring(0, handleCancelIndex) + handlePayNow + content.substring(handleCancelIndex);
    console.log("Added handlePayNow function");
}

if (!content.includes('handlePayNow()')) {
    // Add to dropdown items
    const dropdownCancel = `<DropdownMenuItem className="text-destructive focus:text-destructive"><Ban className="mr-2" /> Cancel</DropdownMenuItem>`;
    const dropdownPay = `{isPatient && appointment.status === 'Payment Pending' && (
          <DropdownMenuItem onClick={handlePayNow} className="text-green-600 focus:text-green-600"><PlayCircle className="mr-2" /> Pay Now</DropdownMenuItem>
        )}\n        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleCancelAppointment}><Ban className="mr-2" /> Cancel</DropdownMenuItem>`;
    
    content = content.replace(dropdownCancel, dropdownPay);

    // Add to sheet items
    const sheetCancel = `<Button variant="destructive" className="w-full justify-start"><Ban className="mr-2" /> Cancel</Button>`;
    const sheetPay = `{isPatient && appointment.status === 'Payment Pending' && (
             <Button variant="outline" className="w-full justify-start text-green-600" onClick={handlePayNow} disabled={!isLoaded}><PlayCircle className="mr-2" /> Pay Now</Button>
          )}\n             <Button variant="destructive" className="w-full justify-start" onClick={handleCancelAppointment}><Ban className="mr-2" /> Cancel</Button>`;
    
    content = content.replace(sheetCancel, sheetPay);
    console.log("Added Pay Now button to UI");
}

fs.writeFileSync(frontendPath, content, 'utf8');

