import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // UID icIoBG4eN5VOw2BvhNiFUnUqmsX2 is the designated Super Admin
        const isSuperUid = user.uid === "icIoBG4eN5VOw2BvhNiFUnUqmsX2";
        
        try {
          // Force refresh the ID token to retrieve up-to-date custom claims
          const idTokenResult = await user.getIdTokenResult(true);
          const hasClaim = idTokenResult.claims.superAdmin === true;
          
          setIsSuperAdmin(hasClaim || isSuperUid);
        } catch (error) {
          console.warn("[Mabala useSuperAdmin] Failed to read custom claims:", error);
          setIsSuperAdmin(isSuperUid);
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
