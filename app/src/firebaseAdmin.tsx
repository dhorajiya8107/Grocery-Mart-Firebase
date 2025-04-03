import admin from 'firebase-admin';
import path from 'path';

const serviceAccount = require(path.resolve(__dirname, '../path-to-your-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'e-commerce-4562f.appspot.com',
  });
}

const bucket = admin.storage().bucket();
 
export { bucket };
