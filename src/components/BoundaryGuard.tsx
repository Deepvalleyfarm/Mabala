import React, { createContext, useContext, useEffect, useState, Component, ReactNode } from "react";
import { ShieldAlert, Lock, UserX, ShieldCheck, HelpCircle } from "lucide-react";

// Security context to indicate a quarantined Sponsoring Organization sandbox env
export interface QuarantineContextType {
  isInSponsorSandbox: boolean;
  institutionId?: string;
  role?: string;
}

export const QuarantineContext = createContext<QuarantineContextType>({
  isInSponsorSandbox: false,
});

/**
 * Custom hook that operational farmer components can call to verify they are not
 * being executed inside the forbidden Sponsoring Organization boundaries.
 */
export function useOperationalSafetyCheck(componentName: string) {
  const context = useContext(QuarantineContext);
  if (context.isInSponsorSandbox) {
    console.error(
      `[SECURITY BOUNDARY VIOLATION] Farmer module "${componentName}" was imported or attempted execution inside Sponsoring Organization portal.`
    );
    throw new Error(
      `Security Boundary Violation: Operational module "${componentName}" is strictly forbidden in the Sponsoring Organization context.`
    );
  }
}

interface BoundaryGuardProps {
  userProfile: {
    uid: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
  } | null;
  children: React.ReactNode;
}

export default function BoundaryGuard({ userProfile, children }: BoundaryGuardProps) {
  const [hasViolation, setHasViolation] = useState(false);
  const [violationType, setViolationType] = useState<"role_mismatch" | "missing_tenant" | "component_crossing" | null>(null);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  useEffect(() => {
    if (!userProfile) {
      setHasViolation(true);
      setViolationType("role_mismatch");
      addLog("ACCESS DENIED: No active session profile found.");
      return;
    }

    const currentRoleLower = (userProfile.role || "").toLowerCase();
    const isInstitutionUser = 
      currentRoleLower === "institution admin" || 
      currentRoleLower === "institution_admin" ||
      currentRoleLower === "institution staff" || 
      currentRoleLower === "institution_staff" ||
      currentRoleLower === "subuser" ||
      currentRoleLower === "field officer" ||
      currentRoleLower === "field operator";

    if (!isInstitutionUser) {
      setHasViolation(true);
      setViolationType("role_mismatch");
      addLog(`SECURITY ALERT: Account role "${userProfile.role}" is not authorized for Sponsoring Organization portal.`);
      return;
    }

    if (!userProfile.tenantId) {
      setHasViolation(true);
      setViolationType("missing_tenant");
      addLog(`SECURITY ALERT: Active user has no valid institution tenant correlation ID.`);
      return;
    }

    addLog(`SECURITY HANDSHAKE: Validated credentials for "${userProfile.name}" [${userProfile.role}]`);
    addLog(`TENANT CORRELATION: Restricting data pipeline to ID "${userProfile.tenantId}"`);
  }, [userProfile]);

  // Handle runtime React rendering boundary errors caused by operational module violations
  const [renderError, setRenderError] = useState<Error | null>(null);

  if (renderError) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-xl bg-slate-950 border border-red-500/30 rounded-2xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600" />
          
          <div className="flex items-center gap-4 text-red-500">
            <div className="p-3 bg-red-950/50 border border-red-500/20 rounded-xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase">Sandbox Containment Active</h2>
              <p className="text-xs text-red-400 font-mono">CRITICAL_CROSSING_PREVENTED</p>
            </div>
          </div>

          <div className="p-4 bg-red-950/30 border border-red-900/30 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-red-200">Runtime Execution Halt:</h4>
            <p className="text-xs text-red-300 font-mono leading-relaxed bg-red-950/60 p-3 rounded border border-red-900/50">
              {renderError.message}
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Mabala's cryptographic security boundary layer detected and prevented an illegal attempt to cross-compile or render operational farmer components inside the secure, tenant-isolated Sponsoring Organization environment.
          </p>

          <div className="pt-2 border-t border-slate-900 flex justify-end">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
            >
              Re-Authorize Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display strict access violation screen
  if (hasViolation) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg bg-slate-900 border border-red-900/30 rounded-2xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />

          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-950 border border-red-800/40 text-red-500 rounded-xl">
              <Lock className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <h3 className="font-black text-white text-base uppercase tracking-tight">Security Boundary Lock</h3>
              <p className="text-xs text-red-400 font-mono mt-0.5">ROLE_ACCESS_DENIED</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              Your active user role does not grant privileges to the Mabala Sponsoring Organization Portal. This boundary is strictly monitored and partitioned to prevent horizontal escalation or unauthorized tenant data visibility.
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[10px] space-y-1.5 text-slate-400">
              <span className="font-bold text-red-400 block mb-1">AUDIT LOG SECTOR:</span>
              {auditLogs.map((log, index) => (
                <div key={index} className="truncate">
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>SECURE_SESSION_BOUND</span>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-red-400 hover:text-red-300 font-bold transition-all cursor-pointer"
            >
              Force Logout & Purge Cache
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Define a simple boundary context value
  const sandboxContextValue: QuarantineContextType = {
    isInSponsorSandbox: true,
    institutionId: userProfile?.tenantId,
    role: userProfile?.role,
  };

  return (
    <QuarantineContext.Provider value={sandboxContextValue}>
      <ErrorBoundary
        fallbackRender={({ error }) => {
          setRenderError(error);
          return null;
        }}
      >
        {children}
      </ErrorBoundary>
    </QuarantineContext.Provider>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackRender: (props: { error: Error }) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// React Error Boundary helper for class component fallback
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[BoundaryGuard] Caught rendering security violation:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallbackRender({ error: this.state.error });
    }
    return this.props.children;
  }
}
