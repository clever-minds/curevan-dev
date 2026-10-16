const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\users\\\\usersController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

// target 1
const t1 = "SELECT id FROM therapist_profiles WHERE user_id = :userId";
const r1 = "SELECT id, profile_status FROM therapist_profiles WHERE user_id = :userId";
code = code.replace(t1, r1);

// target 1.5
const t1_5 = "const profileId = profile?.id || null;";
const r1_5 = "const profileId = profile?.id || null;\\n    const isNewRegistration = profile?.profile_status !== 'approved';";
code = code.replace(t1_5, r1_5);

// target 2
const t2 = `uid: String(userRows.id),
              type: 'profile_update_approved',
              title: 'Profile Update Approved',
              message: 'Your profile changes have been reviewed and approved.',
              link: '/dashboard/account'`;
const r2 = `uid: String(userRows.id),
              type: isNewRegistration ? 'registration_approved' : 'profile_update_approved',
              title: isNewRegistration ? 'Therapist ID Approved' : 'Profile Update Approved',
              message: isNewRegistration ? 'Your therapist account registration and ID creation has been approved.' : 'Your profile changes have been reviewed and approved.',
              link: '/dashboard/account'`;
code = code.replace(t2, r2);

// target 3
const t3 = `firebaseNotifier.sendToTherapist(userRows.fcm_token, 'Profile Update Approved', 'Your profile changes have been reviewed and approved.').catch(e => {`;
const r3 = `firebaseNotifier.sendToTherapist(userRows.fcm_token, isNewRegistration ? 'Therapist ID Approved' : 'Profile Update Approved', isNewRegistration ? 'Your therapist account registration and ID creation has been approved.' : 'Your profile changes have been reviewed and approved.').catch(e => {`;
code = code.replace(t3, r3);

fs.writeFileSync(controllerPath, code, 'utf8');
console.log("Successfully patched usersController.js");
