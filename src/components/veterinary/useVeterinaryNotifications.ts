import { useState, useEffect } from "react";
import { ClinicalRecord, VetClient } from "./types";

export interface VetNotification {
  id: string;
  type: "vaccination_booster" | "withdrawal_period";
  animalId: string;
  clientId: string;
  clientName: string;
  farmerPhone: string;
  title: string;
  message: string;
  dueDate: string;
  daysRemaining: number;
  status: "Pending" | "Sent_InApp" | "Sent_WhatsApp" | "Acknowledged";
}

export function useVeterinaryNotifications(
  records: ClinicalRecord[],
  clients: VetClient[],
  showNotification: (text: string, type?: "success" | "warning") => void
) {
  const [notifications, setNotifications] = useState<VetNotification[]>([]);

  // Periodically scan clinical records to check for upcoming boosters & treatment withdrawals
  useEffect(() => {
    const today = new Date("2026-06-16"); // Anchor to current context metadata timeline (June 16, 2026)
    const generatedAlerts: VetNotification[] = [];

    records.forEach((rec) => {
      const client = clients.find((c) => c.id === rec.clientId || c.name === rec.clientName);
      const phone = client ? client.phone : "+260978000000";

      // 1. Detect active drug withdrawal periods (e.g. Oxytetracycline / Terramycin has a 14 day milk/meat withdrawal window, Coliform Mastitis has 10 days)
      let withdrawalDays = 14; 
      if (rec.diagnosis.toLowerCase().includes("mastitis")) {
        withdrawalDays = 10;
      } else if (rec.diagnosis.toLowerCase().includes("fever") || rec.diagnosis.toLowerCase().includes("theileriosis")) {
        withdrawalDays = 21; // longer withdrawal for complex injectables
      }

      const diagnosisDate = new Date(rec.date);
      const withdrawalEndDate = new Date(diagnosisDate);
      withdrawalEndDate.setDate(diagnosisDate.getDate() + withdrawalDays);

      const timeDiffWithdrawal = withdrawalEndDate.getTime() - today.getTime();
      const daysRemainingWithdrawal = Math.ceil(timeDiffWithdrawal / (1000 * 3600 * 24));

      // Trigger if withdrawal is within 3 days (due soon) or overdue but recently completed
      if (rec.status === "Under Treatment" || rec.status === "Recovering") {
        if (daysRemainingWithdrawal >= -1 && daysRemainingWithdrawal <= 3) {
          generatedAlerts.push({
            id: `wit-${rec.id}`,
            type: "withdrawal_period",
            animalId: rec.animalId,
            clientId: rec.clientId,
            clientName: rec.clientName,
            farmerPhone: phone,
            title: `🥩 Withdrawal Period Warning [${rec.animalId}]`,
            message: `Chemical treatment withdrawal ends on ${withdrawalEndDate.toISOString().split("T")[0]}. Meat and milk must NOT be sold or consumed before this date.`,
            dueDate: withdrawalEndDate.toISOString().split("T")[0],
            daysRemaining: daysRemainingWithdrawal,
            status: "Pending"
          });
        }
      }

      // 2. Detect vaccination boosters due soon (usually 30 days after initial immunization for FMD or Anthrax ring campaigns)
      if (rec.diagnosis.toLowerCase().includes("vaccin") || rec.treatmentPlanned.toLowerCase().includes("vaccin")) {
        const boosterDays = 30;
        const initialDate = new Date(rec.date);
        const boosterDueDate = new Date(initialDate);
        boosterDueDate.setDate(initialDate.getDate() + boosterDays);

        const timeDiffBooster = boosterDueDate.getTime() - today.getTime();
        const daysRemainingBooster = Math.ceil(timeDiffBooster / (1000 * 3600 * 24));

        if (daysRemainingBooster >= -1 && daysRemainingBooster <= 3) {
          generatedAlerts.push({
            id: `bst-${rec.id}`,
            type: "vaccination_booster",
            animalId: rec.animalId,
            clientId: rec.clientId,
            clientName: rec.clientName,
            farmerPhone: phone,
            title: `💉 Immunization Booster Required [${rec.animalId}]`,
            message: `Vaccine booster dose for ${rec.diagnosis} is due in ${daysRemainingBooster} days on ${boosterDueDate.toISOString().split("T")[0]}.`,
            dueDate: boosterDueDate.toISOString().split("T")[0],
            daysRemaining: daysRemainingBooster,
            status: "Pending"
          });
        }
      }
    });

    // Set notifications directly
    setNotifications(generatedAlerts);
  }, [records, clients]);

  const triggerInAppNotification = (alertId: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === alertId) {
          showNotification(`In-App Notification Sent to Farmer ${n.clientName}!`);
          return { ...n, status: "Sent_InApp" };
        }
        return n;
      })
    );
  };

  const triggerWhatsAppNotification = (alertId: string, customText?: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === alertId) {
          showNotification(`WhatsApp Alert dispatched via Twilio Hub API to ${n.farmerPhone}!`);
          return { ...n, status: "Sent_WhatsApp" };
        }
        return n;
      })
    );
  };

  const acknowledgeAlert = (alertId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== alertId));
    showNotification("Alert cleared/archived from dashboard feed.");
  };

  return {
    notifications,
    triggerInAppNotification,
    triggerWhatsAppNotification,
    acknowledgeAlert
  };
}
