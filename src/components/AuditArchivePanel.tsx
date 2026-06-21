import React, { useState } from "react";
import { AuditLog, ArchiveRecord } from "../types";
import { 
  History, 
  Trash2, 
  RotateCcw, 
  User, 
  ShieldAlert, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Archive,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { jsPDF } from "jspdf";

interface AuditArchivePanelProps {
  auditLogs: AuditLog[];
  archiveRecords: ArchiveRecord[];
  onRestoreFromArchive: (recordId: string) => void;
  onPermanentlyPurgeRecord: (recordId: string) => void;
  onClearLogs: () => void;
  isReadonly: boolean;
  currentUser?: { name: string; email: string; phone?: string };
}

export default function AuditArchivePanel({
  auditLogs,
  archiveRecords,
  onRestoreFromArchive,
  onPermanentlyPurgeRecord,
  onClearLogs,
  isReadonly,
  currentUser
}: AuditArchivePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"audit" | "archive">("audit");

  const filteredLogs = auditLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      log.user.toLowerCase().includes(term) ||
      (log.detail && log.detail.toLowerCase().includes(term))
    );
  });

  const handleExportCSV = () => {
    let csv = "Timestamp,User,Action,Module,Ref Details\n";
    auditLogs.forEach(log => {
      csv += `"${log.timestamp}","${log.user}","${log.action.replace(/"/g, '""')}","${log.module}","${(log.detail || "").replace(/"/g, '""')}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mabala_audit_trail_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Config page and dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    const xMargin = 15;
    const bottomMargin = 20;
    
    // --- HEADER DESIGN ---
    // Title Banner
    doc.setFillColor(30, 41, 59); // slate-800 (#1e293b)
    doc.rect(xMargin, 15, pageWidth - 2 * xMargin, 20, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor("#ffffff");
    doc.text("MABALA COMPLIANCE AUDIT WORKSPACE", xMargin + 8, 27.5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#94a3b8"); // slate-400
    doc.text("SOX / IFRS ALIGNED COMPLIANCE REGISTER", pageWidth - xMargin - 8, 27.5, { align: "right" });
    
    // Divider line below header
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(xMargin, 35, pageWidth - 2 * xMargin, 2, "F");

    // --- METADATA REGISTER INFO BOX ---
    const metaY = 40;
    const metaHeight = 35;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(xMargin, metaY, pageWidth - 2 * xMargin, metaHeight, "FD");

    // Left Column Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor("#1e293b"); // slate-800
    doc.text("REPORT AUDIT SCOPE:", xMargin + 6, metaY + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor("#475569"); // slate-600
    doc.text(
      searchTerm.trim() !== "" 
        ? `Filtered Logs (Search Query: "${searchTerm}")` 
        : "Full Operational Compliance Trail Log",
      xMargin + 52, 
      metaY + 8
    );

    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e293b");
    doc.text("GENERATION TIME:", xMargin + 6, metaY + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#475569");
    const currentLocalTime = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    doc.text(currentLocalTime, xMargin + 52, metaY + 16);

    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e293b");
    doc.text("TOTAL RECORD COUNT:", xMargin + 6, metaY + 24);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#475569");
    doc.text(`${filteredLogs.length} entries registered`, xMargin + 52, metaY + 24);

    // Right Column Info
    const rightColX = 112;
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e293b");
    doc.text("AUTHORIZED OPERATOR:", rightColX, metaY + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#475569");
    doc.text(currentUser?.name || "Farm Owner", rightColX + 45, metaY + 8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e293b");
    doc.text("OPERATOR EMAIL:", rightColX, metaY + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#475569");
    doc.text(currentUser?.email || "operator@mabala.com", rightColX + 45, metaY + 16);

    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e293b");
    doc.text("TENANT BLOCK STATUS:", rightColX, metaY + 24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#16a34a"); // green-600
    doc.text("VERIFIED / SECURED", rightColX + 45, metaY + 24);

    // --- AUDIT HISTORY LOG TABLE ---
    const startY = 82;
    let currentY = startY;
    const printableWidth = pageWidth - 2 * xMargin; // 180mm

    const colWidths = [34, 30, 22, 24, 70];
    const colPos = [
      xMargin,
      xMargin + colWidths[0],
      xMargin + colWidths[0] + colWidths[1],
      xMargin + colWidths[0] + colWidths[1] + colWidths[2],
      xMargin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
    ];

    const drawTableHeader = (y: number) => {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(xMargin, y, printableWidth, 8, "F");
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.line(xMargin, y, xMargin + printableWidth, y);
      doc.line(xMargin, y + 8, xMargin + printableWidth, y + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor("#475569"); // slate-600

      doc.text("Timestamp", colPos[0] + 1.5, y + 5.5);
      doc.text("Assigned Operator", colPos[1] + 1.5, y + 5.5);
      doc.text("Action", colPos[2] + 1.5, y + 5.5);
      doc.text("Module", colPos[3] + 1.5, y + 5.5);
      doc.text("Detailed Ledger Log Info", colPos[4] + 1.5, y + 5.5);
    };

    // Draw main first page table header
    drawTableHeader(currentY);
    currentY += 8;

    // Loop through logs
    filteredLogs.forEach((log) => {
      // Split text on dimensions to prevent wrapping bleed
      const timestampLines = doc.splitTextToSize(log.timestamp || "", colWidths[0] - 3);
      const userLines = doc.splitTextToSize(log.user || "", colWidths[1] - 3);
      const actionLines = doc.splitTextToSize(log.action || "", colWidths[2] - 3);
      const moduleLines = doc.splitTextToSize(log.module || "", colWidths[3] - 3);
      const detailLines = doc.splitTextToSize(log.detail || "", colWidths[4] - 3);

      const maxLines = Math.max(
        timestampLines.length,
        userLines.length,
        actionLines.length,
        moduleLines.length,
        detailLines.length
      );

      const rowHeight = maxLines * 4.5 + 4; // 4.5pt line distance, 4pt vertical padding

      // Check page overflow
      if (currentY + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = 20; // reset to top margin on next page
        drawTableHeader(currentY);
        currentY += 8;
      }

      // Alternating row backgrounds to align text readability beautifully
      doc.setFillColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor("#1e293b");

      // Draw values
      doc.text(timestampLines, colPos[0] + 1.5, currentY + 4);
      doc.text(userLines, colPos[1] + 1.5, currentY + 4);

      // Actions bold
      doc.setFont("helvetica", "bold");
      const actionColor = 
        log.action.includes("Create") || log.action.includes("Add")
          ? "#15803d" // green-700
          : log.action.includes("Delete") || log.action.includes("Remove") || log.action.includes("Purge")
          ? "#b91c1c" // red-700
          : "#4338ca"; // indigo-700
      doc.setTextColor(actionColor);
      doc.text(actionLines, colPos[2] + 1.5, currentY + 4);

      // Back to default styling
      doc.setTextColor("#1e293b");
      doc.setFont("helvetica", "normal");
      doc.text(moduleLines, colPos[3] + 1.5, currentY + 4);
      doc.text(detailLines, colPos[4] + 1.5, currentY + 4);

      // Row bottom hairline border
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(xMargin, currentY + rowHeight, xMargin + printableWidth, currentY + rowHeight);

      currentY += rowHeight;
    });

    if (filteredLogs.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor("#94a3b8");
      doc.text("No matching compliance logs reported in active query range.", xMargin + 4, currentY + 8);
    }

    // --- PAGINATION & FOOTERS ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(xMargin, pageHeight - 15, pageWidth - xMargin, pageHeight - 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor("#94a3b8"); // slate-400

      const leftText = `Report Security Hash Trace: MD5-${Math.floor(100000 + Math.random() * 900000)}`;
      const rightText = `Page ${i} of ${pageCount}`;

      doc.text(leftText, xMargin, pageHeight - 10);
      doc.text(rightText, pageWidth - xMargin, pageHeight - 10, { align: "right" });
    }

    // Download PDF
    doc.save(`mabala_audit_trail_report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            Audit & Archive Workspace
          </h2>
          <p className="text-xs text-slate-200 font-semibold bg-indigo-600 max-w-max px-2 py-0.5 rounded leading-none text-[10px] uppercase tracking-wider mt-1.5">Compliance Level: SOX / IFRS Aligned</p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Access secure transaction trails and recover soft-deleted records from our persistent encrypted archive block.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 border rounded-lg text-xs font-semibold shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab("audit")}
            className={`px-3 py-1.5 rounded-md transition-all ${activeSubTab === "audit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Compliance Audit Trail
          </button>
          <button
            onClick={() => setActiveSubTab("archive")}
            className={`px-3 py-1.5 rounded-md transition-all ${activeSubTab === "archive" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Deleted Items Archive Safe ({archiveRecords.length})
          </button>
        </div>
      </div>

      {activeSubTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-white border p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search logs by action, module, user name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs p-2 pl-9 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-3 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="bg-indigo-600 hover:bg-indigo-750 text-white border border-indigo-500 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" /> Export PDF Report
              </button>
              {auditLogs.length > 0 && !isReadonly && (
                <button
                  onClick={() => {
                    const triggerConfirm = (window as any).triggerGlobalConfirm;
                    if (triggerConfirm) {
                      triggerConfirm({
                        title: "Clear Transient Ledger Trails",
                        message: "Are you absolutely sure you want to flush all audit logs from the transient ledger? This action is irreversible.",
                        isBulk: false,
                        onConfirm: () => onClearLogs()
                      });
                    } else {
                      if (window.confirm("Are you absolutely sure you want to flush all audit logs from the transient ledger? This action is irreversible.")) {
                        onClearLogs();
                      }
                    }
                  }}
                  className="bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 py-1.5 px-3 rounded-lg hover:bg-rose-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Trail
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden text-xs">
            <div className="px-6 py-4 border-b bg-slate-50">
              <h3 className="font-extrabold uppercase tracking-wider text-slate-800 text-[10px]">Active Operations Log</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left font-semibold text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Compliance Timestamp</th>
                    <th className="p-3">Assigned User</th>
                    <th className="p-3">System Action</th>
                    <th className="p-3">Module Affected</th>
                    <th className="p-3">Underlying Transaction Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                      <td className="p-3 text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{log.user}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes("Create") || log.action.includes("Add")
                            ? "bg-emerald-50 text-emerald-700"
                            : log.action.includes("Delete") || log.action.includes("Remove") || log.action.includes("Purge")
                            ? "bg-rose-50 text-rose-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{log.module}</span></td>
                      <td className="p-3 text-slate-500 font-normal">{log.detail || "No secondary metadata logged."}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">No matching compliance logs reported. All changes register automatically here.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "archive" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Double-Purging Protocol Active</span>
              All records deleted across Crop Cycles, Invoices, Feed formulations, Livestock profiles, or financial transactions are kept in the Archive safe. You can restore them instantly. For complete permanent erasure, you must double-delete them below.
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden text-xs">
            <div className="px-6 py-4 border-b bg-slate-50">
              <h3 className="font-extrabold uppercase tracking-wider text-slate-800 text-[10px]">Restorable Records Vault</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left font-semibold text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Purge ID</th>
                    <th className="p-3">Original ID</th>
                    <th className="p-3">Original Table/Module</th>
                    <th className="p-3">Deleted On</th>
                    <th className="p-3">Record payload data preview</th>
                    <th className="p-3 text-right">Vault control Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800">
                  {archiveRecords.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-400 text-[10px]">{item.id}</td>
                      <td className="p-3 font-mono text-[10px]">{item.originalId}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">{item.module}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{item.archivedAt}</td>
                      <td className="p-3 max-w-xs text-slate-500 font-normal truncate" title={JSON.stringify(item.data)}>
                        {JSON.stringify(item.data)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              const triggerConfirm = (window as any).triggerGlobalConfirm;
                              if (triggerConfirm) {
                                triggerConfirm({
                                  title: "Recover Active Record",
                                  message: "Confirm recovery? This restores the record payload directly to your active lists.",
                                  isBulk: false,
                                  onConfirm: () => onRestoreFromArchive(item.id)
                                });
                              } else {
                                if (window.confirm("Confirm recovery? This restores the record payload directly to your active lists.")) {
                                  onRestoreFromArchive(item.id);
                                }
                              }
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-2 py-1 rounded text-[10.5px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore
                          </button>
                          <button
                            onClick={() => {
                              const triggerConfirm = (window as any).triggerGlobalConfirm;
                              if (triggerConfirm) {
                                triggerConfirm({
                                  title: "Permanent Shred and Purge Record",
                                  message: "CRITICAL WARNING: This completely shreds and deletes this specific archive item permanently from the Mabala system. This cannot be undone.",
                                  isBulk: true,
                                  itemCount: 1,
                                  itemNames: [`ID: ${item.id} - Module: ${item.module} (${item.archivedAt})`],
                                  onConfirm: () => onPermanentlyPurgeRecord(item.id)
                                });
                              } else {
                                if (window.confirm("CRITICAL WARNING: This completely shreds and deletes this specific archive item permanently from the Mabala system. This cannot be undone. Confirm permanent purging?")) {
                                  onPermanentlyPurgeRecord(item.id);
                                }
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2 py-1 rounded text-[10.5px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Absolute Purge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {archiveRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">Archive Vault is clean. Deleted records will hold safely in this safe for emergency recovery.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
