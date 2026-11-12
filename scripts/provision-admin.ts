import dotenv from 'dotenv';
dotenv.config();

import { admin, adminAuth, ADMIN_EMAIL } from '../server/src/config/firebaseAdmin.ts';

async function provisionAdministrator() {
  console.log("==================================================");
  console.log("DEADLOCKSENSE ADMINISTRATOR PROVISIONING SCRIPT");
  console.log("==================================================");
  console.log(`Designated Administrator Email: ${ADMIN_EMAIL}`);

  if (!adminAuth) {
    console.error("FATAL: Firebase Admin SDK is not initialized. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment.");
    process.exit(1);
  }

  try {
    console.log(`Step 1 & 2: Connecting to Firebase Admin and looking up account for '${ADMIN_EMAIL}'...`);
    const userRecord = await adminAuth.getUserByEmail(ADMIN_EMAIL);

    console.log("Step 3: Account located successfully.");
    console.log(`- UID: ${userRecord.uid}`);
    console.log(`- Display Name: ${userRecord.displayName || '(Not set)'}`);
    console.log(`- Email Verified: ${userRecord.emailVerified}`);

    console.log("Step 4: Checking email verification status...");
    if (!userRecord.emailVerified) {
      console.warn("WARNING: Account email is not yet verified. Updating emailVerified to true for administrator...");
      await adminAuth.updateUser(userRecord.uid, { emailVerified: true });
      console.log("Email verification enforced for administrator.");
    }

    console.log("Step 5: Verifying exact email match...");
    if (userRecord.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      console.error(`FATAL: User email '${userRecord.email}' does not match '${ADMIN_EMAIL}'. Aborting.`);
      process.exit(1);
    }

    console.log("Step 6: Assigning server-side custom claim { admin: true }...");
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    console.log("Step 7: Verifying assigned claims...");
    const refreshedUser = await adminAuth.getUser(userRecord.uid);
    if (refreshedUser.customClaims?.admin === true) {
      console.log("==================================================");
      console.log(`SUCCESS: Administrator '${ADMIN_EMAIL}' has been provisioned with { admin: true }!`);
      console.log("==================================================");
    } else {
      console.error("FAILED: Custom claims could not be verified after assignment.");
      process.exit(1);
    }
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.warn(`User '${ADMIN_EMAIL}' does not yet exist in Firebase Authentication.`);
      console.log("Attempting to pre-create administrator account...");
      try {
        const createdUser = await adminAuth.createUser({
          email: ADMIN_EMAIL,
          emailVerified: true,
          displayName: 'DeadlockSense System Admin'
        });
        await adminAuth.setCustomUserClaims(createdUser.uid, { admin: true });
        console.log(`Successfully pre-created user '${ADMIN_EMAIL}' with UID: ${createdUser.uid} and assigned admin: true claim.`);
      } catch (createErr: any) {
        console.error(`Could not pre-create admin account: ${createErr.message}`);
        console.log("Please register the user via the DeadlockSense application UI first, then re-run this script.");
      }
    } else {
      console.error("Error during administrator provisioning:", error.message);
    }
  }
}

provisionAdministrator();
