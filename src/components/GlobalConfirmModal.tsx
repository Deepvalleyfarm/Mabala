import React, { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X, ShieldAlert, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface GlobalConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isBulk?: boolean;
  itemCount?: number;
  itemNames?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GlobalConfirmModal({
  isOpen,
  title,
  message,
  isBulk = false,
  itemCount = 0,
  itemNames = [],
  onConfirm,
  onCancel
}: GlobalConfirmModalProps) {
  const [safetyCheck, setSafetyCheck] = useState(false);
  const [typeConfirmation, setTypeConfirmation] = useState("");
  
  // Reset fields when modal is shown/hidden
  useEffect(() => {
    if (isOpen) {
      setSafetyCheck(false);
      setTypeConfirmation("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requiresTyping = isBulk && itemCount > 1;
  const isConfirmEnabled = safetyCheck && (!requiresTyping || typeConfirmation.toUpperCase() === "DELETE");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-6">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Card container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 font-sans"
        >
          {/* Top warning ribbon */}
          <div className="h-2 bg-gradient-to-r from-amber-500 to-rose-600" />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">{title}</h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Registry Integrity Protection Active</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="text-xs text-slate-600 leading-relaxed font-medium">
              {message}
            </div>

            {/* Selected item metadata box */}
            {isBulk && itemCount > 0 && (
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-widest flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Selected Records ({itemCount})
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">Bulk Action</span>
                </div>
                {itemNames.length > 0 && (
                  <div className="text-[10.5px] text-slate-600 font-bold max-h-24 overflow-y-auto pr-1 space-y-1 divide-y divide-slate-100">
                    {itemNames.map((name, idx) => (
                      <div key={idx} className="pt-1 first:pt-0 font-mono text-slate-700">
                        • {name}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[9px] text-slate-500 italic">
                  Note: Deleted records will be soft-deleted and placed in the Mabala Audit Archive for recovery.
                </div>
              </div>
            )}

            {/* Additional checklist double check */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer select-none transition-all hover:bg-slate-100/50">
              <input
                type="checkbox"
                checked={safetyCheck}
                onChange={(e) => setSafetyCheck(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <div className="text-[11px] font-bold text-slate-700 leading-normal">
                I verify that I want to continue with this action and understand it affects farm registry summaries.
              </div>
            </label>

            {/* Type to confirm block (for multiple items bulk delete) */}
            {requiresTyping && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  Type <strong className="text-rose-600 font-black">DELETE</strong> to confirm bulk erasure:
                </label>
                <input
                  type="text"
                  value={typeConfirmation}
                  onChange={(e) => setTypeConfirmation(e.target.value)}
                  placeholder="Type 'DELETE' here"
                  className="w-full text-xs font-bold font-mono border rounded-xl p-2.5 outline-none bg-slate-50 focus:bg-white text-slate-800 border-slate-200 focus:border-rose-500 transition-all uppercase"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border bg-white border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              No, Cancel
            </button>
            <button
              onClick={() => {
                if (isConfirmEnabled) {
                  onConfirm();
                }
              }}
              disabled={!isConfirmEnabled}
              className={`px-4 py-2 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                isConfirmEnabled
                  ? "bg-rose-600 hover:bg-rose-700 shadow-md active:scale-95"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Yes, Delete Records</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
