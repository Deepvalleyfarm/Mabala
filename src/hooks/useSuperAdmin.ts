import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const docRef = doc(db, "users_data", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.role === "Super Admin") {
              setIsSuperAdmin(true);
            } else {
              setIsSuperAdmin(false);
            }
          } else {
            // Seed check if the database is unpopulated yet as a helper
            const isSeed = user.email === "deepvaleyfarm@gmail.com" && user.uid === "icIoBG4eN5VOw2BvhNiFUnUqmsX2";
            setIsSuperAdmin(isSeed);
          }
        } catch (error) {
          console.warn("[Mabala useSuperAdmin] Failed to check Firestore:", error);
          const isSeed = user.email === "deepvaleyfarm@gmail.com" && user.uid === "icIoBG4eN5VOw2BvhNiFUnUqmsX2";
          setIsSuperAdmin(isSeed);
        }
      } else {
        setIsSuperAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isSuperAdmin, isLoading };
}
