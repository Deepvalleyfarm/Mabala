import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

try {
  const app = admin.initializeApp({
    projectId: "mabala-f2d65"
  });
  const dbId = "ai-studio-020042e7-7cf8-4e86-bdea-ea1ae9737651";
  const db = getFirestore(app, dbId);
  console.log("Firebase initialized successfully");
  
  // Directly write and read a document using the Admin SDK!
  const testDocRef = db.collection("promoMessages").doc("test_admin_sdk_doc");
  
  testDocRef.set({
    test_value: "hello from Admin SDK!",
    timestamp: new Date().toISOString()
  }).then(() => {
    console.log("Admin SDK: Successfully wrote test document!");
    
    testDocRef.get().then(snap => {
      console.log("Admin SDK: Successfully read document!", snap.data());
      
      // Clean up
      testDocRef.delete().then(() => {
        console.log("Admin SDK: Successfully cleaned up test document!");
      });
    });
  }).catch(err => {
    console.error("Admin SDK write/read failed:", err.message);
  });
} catch (error: any) {
  console.error("Init failed:", error.message);
}
