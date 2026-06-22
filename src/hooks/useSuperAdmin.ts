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
        const isSelf = user.uid === "icIoBG4eN5VOw2BvhNiFUnUqmsX2" && user.email === "deepvaleyfarm@gmail.com";
        setIsSuperAdmin(isSelf);
      } else {
        setIsSuperAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isSuperAdmin, isLoading };
}
