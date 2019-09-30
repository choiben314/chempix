const functions = require('firebase-functions');
const admin = require('firebase-admin');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp();
const db = admin.firestore();

const createProfile = (userRecord, context) => {
  const {email, uid } = userRecord;
  if (email.endsWith("stanford.edu")) {
	  return db
	    .collection('Users')
	    .doc(uid)
	    .set({ email })
	    .catch(console.error);
	}
};

module.exports = {
  authOnCreate: functions.auth.user().onCreate(createProfile),
};

