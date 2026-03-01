

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
dotenv.config();

// --- Import Seed Data ---
import users from './seed/users.json' with { type: "json" };
import therapistProfiles from './seed/therapistProfiles.json' with { type: "json" };
import patientProfiles from './seed/patientProfiles.json' with { type: "json" };
import appointments from './seed/appointments.json' with { type: "json" };
import products from './seed/products.json' with { type: "json" };
import productCategories from './seed/productCategories.json' with { type: "json" };
import orders from './seed/orders.json' with { type: "json" };
import pcr from './seed/pcr.json' with { type: "json" };
import coupons from './seed/coupons.json' with { type: "json" };
import journal from './seed/journal.json' with { type: "json" };
import trainings from './seed/trainings.json' with { type: "json" };
import documentation from './seed/documentation.json' with { type: "json" };
import profileChangeRequests from './seed/profileChangeRequests.json' with { type: "json" };
import invoices from './seed/invoices.json' with { type: "json" };
import sessions from './seed/sessions.json' with { type: "json" };
import supportTickets from './seed/supportTickets.json' with { type: "json" };
import inventory from './seed/inventory.json' with { type: "json" };
import notifications from './seed/notifications.json' with { type: "json" };
import payoutItems from './seed/payoutItems.json' with { type: "json" };
import payoutBatches from './seed/payoutBatches.json' with { type: "json" };
import auditLogs from './seed/auditLogs.json' with { type: "json" };
import newsletterSubscribers from './seed/newsletterSubscribers.json' with { type: "json" };


// --- Initialize Firebase Admin SDK ---
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.");
  console.log("Please set it to the path of your Firebase service account key file.");
  process.exit(1);
}
if (!process.env.TEST_USER_PASSWORD) {
    console.error("TEST_USER_PASSWORD environment variable not set.");
    process.exit(1);
}

try {
  initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
      console.error("Failed to initialize Firebase Admin SDK. Make sure your GOOGLE_APPLICATION_CREDENTIALS path is correct.", error);
      process.exit(1);
  }
}

const db = getFirestore();
const auth = getAuth();
const testUserPassword = process.env.TEST_USER_PASSWORD;

// --- Helper Functions ---
async function seedCollection(collectionName, data, idField = null) {
  const collectionRef = db.collection(collectionName);
  const promises = [];
  console.log(`\nSeeding ${collectionName}...`);

  for (const key in data) {
    const docData = data[key];
    const docId = idField ? docData[idField] : key;

    if (!docId) {
        console.warn(`Skipping document in ${collectionName} due to missing ID.`);
        continue;
    }

    const processedData = convertDatesToTimestamp(docData);
    
    const docRef = collectionRef.doc(docId);
    promises.push(docRef.set(processedData, { merge: true }));
  }

  await Promise.all(promises);
  console.log(`Seeded ${Object.keys(data).length} documents into ${collectionName}.`);
}

function convertDatesToTimestamp(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'string' && obj[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)) {
            obj[key] = Timestamp.fromDate(new Date(obj[key]));
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (obj[key].hasOwnProperty('_seconds') && obj[key].hasOwnProperty('_nanoseconds')) {
                 obj[key] = new Timestamp(obj[key]._seconds, obj[key]._nanoseconds);
            } else {
                convertDatesToTimestamp(obj[key]);
            }
        }
    }
    return obj;
}

async function createUsersAndSetClaims() {
  console.log('\nSeeding users and setting custom claims...');
  for (const uid in users) {
    const user = users[uid];
    const claims = { role: user.role, roles: user.roles || [] };

    try {
      // Attempt to create the user with the specified UID from JSON
      await auth.createUser({
        uid: uid,
        email: user.email,
        password: testUserPassword,
        displayName: user.name,
        emailVerified: true,
      });
      console.log(`Created user: ${user.email} with UID: ${uid}`);
      
      // Set claims for the newly created user
      await auth.setCustomUserClaims(uid, claims);
      console.log(`Set custom claims for new user: ${user.email}`);

    } catch (error) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log(`User with email ${user.email} already exists. Fetching by email to set claims.`);
        try {
          // The user exists, but the UID in the JSON might be wrong. Fetch the user by email to get the correct UID.
          const firebaseUser = await auth.getUserByEmail(user.email);
          const correctUid = firebaseUser.uid;
          
          // Set claims using the authoritative UID from Firebase
          await auth.setCustomUserClaims(correctUid, claims);
          console.log(`Set/updated claims for existing user ${user.email} (UID: ${correctUid})`);

        } catch (lookupError) {
          console.error(`Error looking up or setting claims for existing user ${user.email}:`, lookupError);
        }
      } else {
        // Log any other user creation errors and do not proceed with claims
        console.error(`Error during creation of user ${user.email}:`, error);
      }
    }
  }
}

// --- Main Seeding Logic ---
async function seedDatabase() {
  console.log('Starting database seeding...');

  // Step 1: Create or update users and their claims.
  await createUsersAndSetClaims();
  
  // Step 2: Seed all other Firestore collections. This is safe now.
  await seedCollection('users', users, 'uid');
  await seedCollection('therapistProfiles', therapistProfiles);
  await seedCollection('patientProfiles', patientProfiles);
  await seedCollection('appointments', appointments);
  await seedCollection('products', products);
  await seedCollection('productCategories', productCategories);
  await seedCollection('orders', orders);
  await seedCollection('pcr', pcr);
  await seedCollection('coupons', coupons);
  await seedCollection('journal', journal);
  await seedCollection('trainings', trainings);
  await seedCollection('documentation', documentation);
  await seedCollection('profileChangeRequests', profileChangeRequests);
  await seedCollection('invoices', invoices);
  await seedCollection('sessions', sessions);
  await seedCollection('supportTickets', supportTickets);
  await seedCollection('inventory', inventory);
  await seedCollection('notifications', notifications);
  await seedCollection('payoutItems', payoutItems);
  await seedCollection('payoutBatches', payoutBatches);
  await seedCollection('auditLogs', auditLogs);
  await seedCollection('newsletterSubscribers', newsletterSubscribers);


  console.log('\nDatabase seeding completed successfully!');
}

seedDatabase().catch(error => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
