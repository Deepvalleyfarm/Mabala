import { 
  doc, 
  updateDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "../firebase";

export const getCookie = (name: string): string | undefined => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  } catch (e) {
    console.warn("[Referral] Failed to read cookie:", e);
  }
  return undefined;
};

export const getReferralData = () => {
  if (typeof window === "undefined") return { refCode: undefined, clickId: undefined };
  const urlParams = new URLSearchParams(window.location.search);
  const urlRefCode = urlParams.get("ref");
  const urlClickId = urlParams.get("click_id");
  const refCode = urlRefCode || getCookie("mabala_ref_code");
  const clickId = urlClickId || getCookie("mabala_click_id");
  return { refCode, clickId };
};

export const processReferralSignup = async (
  uid: string, 
  email: string, 
  tenantName: string, 
  subscriptionTier: string, 
  firstPaymentAmount = 0
) => {
  try {
    const { refCode, clickId } = getReferralData();
    if (!refCode) {
      console.log("[Referral Engine] No referral code detected in session.");
      return;
    }

    const cleanRefCode = refCode.toUpperCase().trim();
    console.log(`[Referral Engine] Processing signup for user ${uid}. Ref: ${cleanRefCode}, ClickId: ${clickId}`);

    // 1. Query the partner doc
    const partnersRef = collection(db, "partners");
    const q = query(partnersRef, where("referralCode", "==", cleanRefCode));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.warn(`[Referral Engine] Partner with code ${cleanRefCode} not found in database.`);
      return;
    }

    const partnerDoc = snap.docs[0];
    const partnerId = partnerDoc.id;
    const partnerData = partnerDoc.data();

    // Enforce active status
    if (partnerData.status !== "active") {
      console.warn(`[Referral Engine] Partner is not active (status: ${partnerData.status}). Skipping attribution.`);
      return;
    }

    // Fraud check: No self-referrals
    if (partnerData.email && partnerData.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      console.warn(`[Referral Engine] Self-referral protection triggered: Partner and tenant emails match (${email}). Bypassing.`);
      return;
    }

    // 2. Increment partner's totalSignups
    await updateDoc(doc(db, "partners", partnerId), {
      totalSignups: (partnerData.totalSignups || 0) + 1
    });

    // 3. Mark the click log as converted
    if (clickId) {
      try {
        await updateDoc(doc(db, "referralClicks", clickId), {
          convertedToSignup: true,
          convertedTenantId: uid
        });
      } catch (clickErr) {
        console.warn("[Referral Engine] Click log conversion update failed:", clickErr);
      }
    }

    // 4. Create the conversion record
    const conversionId = "conv_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const commissionRate = partnerData.commissionRate || 0.15;
    const isPaidConversion = firstPaymentAmount > 0;
    const commissionAmount = isPaidConversion ? firstPaymentAmount * commissionRate : 0;

    await setDoc(doc(db, "referralConversions", conversionId), {
      id: conversionId,
      partnerId,
      partnerName: partnerData.fullName || "Mabala Partner",
      referralCode: cleanRefCode,
      clickId: clickId || null,
      tenantId: uid,
      tenantName,
      tenantEmail: email,
      signupDate: new Date().toISOString(),
      planAtFirstPayment: subscriptionTier,
      firstPaymentAmount,
      firstPaymentDate: isPaidConversion ? new Date().toISOString() : null,
      commissionRate,
      commissionAmount,
      payoutStatus: "pending",
      payoutDate: null,
      payoutReference: null
    });

    // 5. Update partner cumulative metrics if paid conversion
    if (isPaidConversion) {
      await updateDoc(doc(db, "partners", partnerId), {
        totalPaidConversions: (partnerData.totalPaidConversions || 0) + 1,
        totalCommissionEarned: (partnerData.totalCommissionEarned || 0) + commissionAmount
      });
    }

    console.log(`[Referral Engine] Successfully logged referral signup for partner ${partnerId}. Earned commission: ZK ${commissionAmount}`);

  } catch (err) {
    console.error("[Referral Engine] Error processing referral signup:", err);
  }
};
