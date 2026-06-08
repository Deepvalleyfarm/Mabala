import React, { useState } from "react";
import { 
  Users, 
  Shield, 
  UserPlus, 
  Lock, 
  Unlock, 
  Check, 
  HelpCircle, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Mail,
  UserSquare2
} from "lucide-react";
import { PredefinedRole, RolePermissions, RolePermissionsMap, UserMember } from "../types";

interface AccessControlPanelProps {
  currentRole: PredefinedRole;
  onChangeSessionRole: (role: PredefinedRole) => void;
  permissions: RolePermissionsMap;
  onUpdatePermission: (role: PredefinedRole, moduleId: string, type: "read" | "write", value: boolean) => void;
  teamMembers: UserMember[];
  onAddTeamMember: (member: Omit<UserMember, "id" | "lastActive">) => void;
  onRemoveTeamMember: (id: string) => void;
  onChangeMemberRole: (id: string, role: PredefinedRole) => void;
  currencySymbol: string;
  adminClaimed: boolean;
  userEmail: string;
  activeFarmName: string;
  adminClaimantEmail: string;
  farms?: any[];
  subscriptionTier?: string;
}

export default function AccessControlPanel({
  currentRole,
  onChangeSessionRole,
  permissions,
  onUpdatePermission,
  teamMembers,
  onAddTeamMember,
  onRemoveTeamMember,
  onChangeMemberRole,
  currencySymbol,
  adminClaimed,
  userEmail,
  activeFarmName,
  adminClaimantEmail,
  farms = [],
  subscriptionTier
}: AccessControlPanelProps) {
  const [activeRoleTab, setActiveRoleTab] = useState<PredefinedRole>("Accountant");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // New Member Form States
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<PredefinedRole>("Farm Worker");
  const [selectedFarmIds, setSelectedFarmIds] = useState<string[]>([]);

  const rolesList: PredefinedRole[] = (() => {
    const isDeepValleyAdmin = userEmail === "deepvaleyfarm@gmail.com";
    const isClaimant = !adminClaimantEmail || userEmail === adminClaimantEmail || isDeepValleyAdmin;

    if (!isClaimant) {
      return ["Farm Owner", "Accountant", "Farm Worker"];
    }
    return ["Platform Administrator", "Farm Owner", "Accountant", "Farm Worker"];
  })();

  const matrixRoles: PredefinedRole[] = ["Farm Owner", "Accountant", "Farm Worker"];

  const moduleList = [
    { id: "dashboard", label: "Dashboard Hub", desc: "Overview of farm YTD revenue, expenses and active operations tiles" },
    { id: "accounts", label: "Chart of Accounts", desc: "Management of asset, liability, and equity double-entry account structures" },
    { id: "expenses", label: "Expenses Ledger", desc: "Posting dual-entry vouchers and supplier expense allocations" },
    { id: "crops", label: "Crop Cycles (Tasks)", desc: "Continuous stage block planning, planting records and crop status workflows" },
    { id: "payroll", label: "Payroll localizer (Pro)", desc: "Statutory PAYE, NAPSA, NHIMA levy calculations and staff payslips" },
    { id: "sales", label: "Sales Tracker", desc: "Direct farm retail cash receipts and auto-mapped general ledger balances" },
    { id: "invoices", label: "Invoices & Quotes", desc: "Drafting, editing, sending and receiving invoice status updates" },
    { id: "livestock", label: "Livestock & Poultry Records", desc: "Health events tracking, vaccination schedules, egg collections" },
    { id: "aquaculture", label: "Aquaculture Systems", desc: "Pond water parameters monitoring, DO levels readings, and sample weight logs" },
    { id: "inventory", label: "Inventory & Stock", desc: "Store rooms average cost valuation model and low stock warning triggers" },
    { id: "reports", label: "Financial Reports", desc: "GAAP, IFRS profit/loss sheets, balance sheets, and statutory tax estimates" },
  ];

  const handleCreateMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;
    
    // Check user organization list limit based on Enterprise subscription
    const maxTeamUsers = subscriptionTier === "Enterprise Suite" ? 20 : 10;
    if (teamMembers.length >= maxTeamUsers) {
      alert(`Under your package (${subscriptionTier || "Standard"}), organization limits are restricted to ${maxTeamUsers} team users. Please upgrade or prune inactive users.`);
      return;
    }

    onAddTeamMember({
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      accessibleFarmIds: selectedFarmIds,
    });

    // Reset Form
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("Farm Worker");
    setSelectedFarmIds([]);
    setShowAddMemberModal(false);
  };

  const isOwner = currentRole === "Platform Administrator" || currentRole === "Farm Owner";

  return (
    <div className="space-y-8 animate-fade-in" id="access-control-panel-container">
      {/* Simulation Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase rounded-full font-mono tracking-wider">Simulation System</span>
            <span className="text-xs text-slate-400 font-medium">Role-Based Access Control (RBAC) Engine</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Active User Role Simulator</h2>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Switch your current role instantly to test how the Mabala SaaS limits or unlocks various screens and actions. 
            Owners hold ultimate authority, Accountants manage financial workflows, and Farm Workers coordinate field operations.
          </p>
        </div>
        
        <div className="flex flex-col gap-2 shrink-0 bg-slate-800/80 p-4 border border-slate-700/60 rounded-xl items-stretch w-full md:w-auto">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono text-center md:text-left">Select Simulator Identity:</span>
          <div className="flex flex-wrap gap-2">
            {rolesList.map((r) => {
              const active = currentRole === r;
              return (
                <button
                  key={r}
                  onClick={() => onChangeSessionRole(r)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    active 
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10" 
                      : "bg-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                  id={`simulator-role-btn-${r.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{r}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dynamic Permissions Matrix (Left side) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Granular Permissions Matrix</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-1">
                Configure module reading and writing capabilities for each predefined tenant role setup.
              </p>
            </div>
            
            {/* View Tab Roles Selector */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {matrixRoles.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveRoleTab(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    activeRoleTab === tab 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {!isOwner && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 font-semibold flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Read-Only Preview: Dynamic editing is blocked. Switch simulator role to <strong>Platform Administrator</strong> or <strong>Farm Owner</strong> to customize the matrices directly.</span>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="pb-3 w-1/2">Module & Feature Scope</th>
                    <th className="pb-3 text-center px-4 w-1/4">Read Access</th>
                    <th className="pb-3 text-center px-4 w-1/4">Write / Edit Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {moduleList.map((mod) => {
                    const perm = permissions[activeRoleTab]?.[mod.id] || { read: false, write: false };
                    
                    // Specific locks or hardcoding for Owner/Admin (Owner and Admin always have full permissions)
                    const isAlwaysFull = activeRoleTab === "Platform Administrator" || activeRoleTab === "Farm Owner";
                    
                    return (
                      <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pr-4">
                          <span className="text-xs font-extrabold text-slate-900 block">{mod.label}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-normal leading-relaxed">{mod.desc}</span>
                        </td>
                        
                        {/* Read Toggle */}
                        <td className="py-4 text-center px-4">
                          <div className="flex justify-center items-center">
                            {isAlwaysFull ? (
                              <div className="w-9 h-5 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center font-bold text-[9px] font-mono border border-emerald-500/30">
                                <Unlock className="w-2.5 h-2.5 mr-0.5" /> ON
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={!isOwner}
                                onClick={() => onUpdatePermission(activeRoleTab, mod.id, "read", !perm.read)}
                                className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-200 outline-none ${
                                  perm.read ? "bg-emerald-500" : "bg-slate-200"
                                } ${!isOwner ? "opacity-60 cursor-not-allowed" : ""}`}
                              >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                                  perm.read ? "translate-x-4" : "translate-x-0"
                                }`}>
                                  {perm.read ? <Check className="w-3 h-3 text-emerald-600 font-bold" /> : <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                </div>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Write Toggle */}
                        <td className="py-4 text-center px-4">
                          <div className="flex justify-center items-center">
                            {isAlwaysFull ? (
                              <div className="w-9 h-5 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center font-bold text-[9px] font-mono border border-emerald-500/30">
                                <Unlock className="w-2.5 h-2.5 mr-0.5" /> ON
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={!isOwner || !perm.read} // Cannot have write access without read permission
                                onClick={() => onUpdatePermission(activeRoleTab, mod.id, "write", !perm.write)}
                                className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-200 outline-none ${
                                  perm.write && perm.read ? "bg-emerald-500" : "bg-slate-200"
                                } ${(!isOwner || !perm.read) ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                                  perm.write && perm.read ? "translate-x-4" : "translate-x-0"
                                }`}>
                                  {perm.write && perm.read ? <Check className="w-3 h-3 text-emerald-600 font-bold" /> : <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                </div>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dynamic Tenant team Directory (Right side) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Tenant Org Directory</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Multi-tenant account holder directory mapping active roles.</p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(true)}
                disabled={!isOwner}
                className={`p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors ${!isOwner ? "opacity-40 cursor-not-allowed" : ""}`}
                title="Add Team Member"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all flex justify-between items-start gap-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-700 text-xs shadow-inner">
                      {member.avatar || member.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{member.name}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-300" />
                        Active {member.lastActive}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {/* Role Dropdown */}
                    {isOwner && member.email !== "shikasuli@gmail.com" ? (
                      <select
                        value={member.role}
                        onChange={(e) => onChangeMemberRole(member.id, e.target.value as PredefinedRole)}
                        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-700 outline-none cursor-pointer font-sans"
                      >
                        <option value="Platform Administrator">Platform Admin</option>
                        <option value="Farm Owner">Owner</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Farm Worker">Worker</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        member.role === "Platform Administrator" 
                          ? "bg-purple-50 border-purple-200 text-purple-700 font-extrabold"
                          : member.role === "Farm Owner" 
                            ? "bg-rose-50 border-rose-200 text-rose-600" 
                            : member.role === "Accountant"
                              ? "bg-amber-50 border-amber-200 text-amber-600"
                              : "bg-blue-50 border-blue-200 text-blue-600"
                      }`}>
                        {member.role}
                      </span>
                    )}

                    {isOwner && member.email !== "shikasuli@gmail.com" && (
                      <button
                        onClick={() => onRemoveTeamMember(member.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                        title="Revoke Tenant Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <div className="text-center p-6 italic text-slate-400 text-xs">No users listed in this tenant organizational structure.</div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
              <UserSquare2 className="w-4 h-4 text-emerald-600" />
              <span>SaaS Compliance Guideline</span>
            </h4>
            <div className="text-[11px] font-medium text-slate-500 space-y-2 leading-relaxed">
              <p>✔ Every individual access log maps back to audited Double-Entry General Ledger events.</p>
              <p>✔ Invoices, quote conversions and compliance payroll runs mandate strict 2FA secure approval tokens, matching statutory regulations across African subscribers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen">
          <form onSubmit={handleCreateMemberSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-scale-up">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest pb-2 border-b">Invite Team Member</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Authorize user access to this isolated SaaS workspace. Standard invites automatically inherit default permissions for the selected role.
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kondwani Phiri" 
                  value={newMemberName} 
                  onChange={e => setNewMemberName(e.target.value)} 
                  required 
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. kondwani@gmail.com" 
                  value={newMemberEmail} 
                  onChange={e => setNewMemberEmail(e.target.value)} 
                  required 
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Assigned Workspace Role</label>
                <select
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value as PredefinedRole)}
                  className="w-full text-xs mt-1 p-2 border rounded outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white font-semibold text-slate-800"
                >
                  {currentRole === "Platform Administrator" && (
                    <option value="Platform Administrator">Platform Administrator (Global Super User)</option>
                  )}
                  <option value="Accountant">Accountant (Financial Administrator)</option>
                  <option value="Farm Worker">Farm Worker (Field Operations)</option>
                  <option value="Farm Owner">Farm Owner (Full Workspace Administrator)</option>
                </select>
              </div>

              {subscriptionTier === "Enterprise Suite" && farms && farms.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Accessible Farm Nodes</label>
                  <p className="text-[10px] text-slate-400 font-medium">Configure which farming segments this user is authorized to view.</p>
                  <div className="mt-1 border border-slate-200/60 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50 max-h-[140px] overflow-y-auto">
                    {farms.map(f => {
                      const checked = selectedFarmIds.includes(f.id);
                      return (
                        <label key={f.id} className="flex items-center gap-2 text-xs font-semibold text-slate-705 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSelectedFarmIds(prev => prev.filter(id => id !== f.id));
                              } else {
                                setSelectedFarmIds(prev => [...prev, f.id]);
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                          />
                          <span>{f.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4 text-xs font-semibold">
              <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500">Send Secure Invite</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
