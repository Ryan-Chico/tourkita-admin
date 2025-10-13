// admin.js (Node.js server)
import admin from "firebase-admin";

admin.auth().setCustomUserClaims(uidOfAdminUser, { admin: true })
    .then(() => console.log("Admin claim set!"))
    .catch(console.error);
