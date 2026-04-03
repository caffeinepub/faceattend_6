import { useCamera } from "@/camera/useCamera";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ScanFace,
  SwitchCamera,
  UserCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  type DescriptorEntry,
  type PersonSummary,
  useGetAllFaceDescriptors,
  useGetAllPersons,
  useRecordAttendance,
} from "../hooks/useQueries";
import { loadSettings } from "../hooks/useSettings";
import { type FaceApi, MODEL_URL, getFaceApi } from "../utils/faceApiCdn";

type ScanStatus = "idle" | "no-face" | "unknown" | "match";

interface MatchResult {
  personId: bigint;
  name: string;
  personTypeStr: string;
  entry: DescriptorEntry;
}

const SLOTS = [
  { name: "Morning", label: "Morning", time: "6–10 AM", start: 6, end: 10 },
  {
    name: "Late Morning",
    label: "Late Morning",
    time: "10–12 PM",
    start: 10,
    end: 12,
  },
  {
    name: "Afternoon",
    label: "Afternoon",
    time: "12–4 PM",
    start: 12,
    end: 16,
  },
  { name: "Evening", label: "Evening", time: "4–8 PM", start: 16, end: 20 },
];

function getCurrentSlot(): string {
  const h = new Date().getHours();
  const slot = SLOTS.find((s) => h >= s.start && h < s.end);
  return slot ? slot.name : "General";
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function FaceScan() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [showManualBtn, setShowManualBtn] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);
  const faceApiRef = useRef<FaceApi | null>(null);
  const manualBtnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoManualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelsLoadedRef = useRef(false);

  const { actor } = useActor();
  const { data: descriptors = [] } = useGetAllFaceDescriptors();
  const { data: persons = [] } = useGetAllPersons();
  const recordAttendance = useRecordAttendance();

  const {
    isActive,
    isLoading: camLoading,
    error: camError,
    startCamera,
    videoRef,
    canvasRef,
    switchCamera,
  } = useCamera({ facingMode: "user", width: 640, height: 480 });

  const loadModels = useCallback(async () => {
    if (modelsLoaded || loadingModels) return;
    setLoadingModels(true);
    try {
      const fa = await getFaceApi();
      faceApiRef.current = fa;
      await Promise.all([
        fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      if (manualBtnTimerRef.current) clearTimeout(manualBtnTimerRef.current);
      if (autoManualTimerRef.current) clearTimeout(autoManualTimerRef.current);
    } catch (_e) {
      toast.error("Failed to load AI models — switching to manual mode");
      setManualMode(true);
    } finally {
      setLoadingModels(false);
    }
  }, [modelsLoaded, loadingModels]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    loadModels();
    startCamera();
    manualBtnTimerRef.current = setTimeout(() => setShowManualBtn(true), 5000);
    autoManualTimerRef.current = setTimeout(() => {
      if (!modelsLoadedRef.current) {
        setManualMode((prev) => {
          if (!prev) toast.info("AI not available — switched to manual mode");
          return true;
        });
      }
    }, 12000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (manualBtnTimerRef.current) clearTimeout(manualBtnTimerRef.current);
      if (autoManualTimerRef.current) clearTimeout(autoManualTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      modelsLoadedRef.current = true;
      setShowManualBtn(false);
      setManualMode(false);
      if (manualBtnTimerRef.current) clearTimeout(manualBtnTimerRef.current);
      if (autoManualTimerRef.current) clearTimeout(autoManualTimerRef.current);
    }
  }, [modelsLoaded]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: videoRef is stable
  useEffect(() => {
    if (!isActive || !modelsLoaded) return;
    const fa = faceApiRef.current;
    if (!fa) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (isProcessingRef.current || !videoRef.current) return;
      isProcessingRef.current = true;
      try {
        const detection = await fa
          .detectSingleFace(
            videoRef.current,
            new fa.SsdMobilenetv1Options({ minConfidence: 0.5 }),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (!detection) {
          setScanStatus("no-face");
          setMatchResult(null);
          setAlreadyCheckedIn(false);
          isProcessingRef.current = false;
          return;
        }
        if (descriptors.length === 0) {
          setScanStatus("unknown");
          setMatchResult(null);
          isProcessingRef.current = false;
          return;
        }
        let bestDist = Number.POSITIVE_INFINITY;
        let bestEntry: DescriptorEntry | null = null;
        const queryDesc = detection.descriptor;
        for (const entry of descriptors) {
          const stored = new Float32Array(entry.faceDescriptor);
          const dist = fa.euclideanDistance(queryDesc, stored);
          if (dist < bestDist) {
            bestDist = dist;
            bestEntry = entry;
          }
        }
        if (bestDist < 0.6 && bestEntry) {
          const typeStr =
            bestEntry.personType === "student" ? "student" : "employee";
          const result: MatchResult = {
            personId: bestEntry.id,
            name: bestEntry.name,
            personTypeStr: typeStr,
            entry: bestEntry,
          };
          setScanStatus("match");
          setMatchResult(result);
          const slot = getCurrentSlot();
          const dateStr = toLocalDateStr(new Date());
          if (slot && actor) {
            const already = await actor.hasAttendedSlot(
              bestEntry.id,
              slot,
              dateStr,
            );
            setAlreadyCheckedIn(already);
          }
        } else {
          setScanStatus("unknown");
          setMatchResult(null);
          setAlreadyCheckedIn(false);
        }
      } catch (_e) {
        // silently ignore frame errors
      } finally {
        isProcessingRef.current = false;
      }
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, modelsLoaded, descriptors, actor]);

  const handleMarkAttendance = async (overrideMatch?: MatchResult) => {
    const target = overrideMatch ?? matchResult;
    if (!target) return;
    const slot = getCurrentSlot();
    const now = new Date();
    const dateStr = toLocalDateStr(now);
    const monthStr = dateStr.slice(0, 7);
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const year = BigInt(now.getFullYear());
    const month = BigInt(now.getMonth() + 1);
    const day = BigInt(now.getDate());
    if (!overrideMatch && alreadyCheckedIn) {
      toast.warning(`${target.name} already checked in for ${slot} slot`);
      return;
    }
    setMarkingAttendance(true);
    try {
      await recordAttendance.mutateAsync({
        personId: target.personId,
        personTypeStr: target.personTypeStr,
        name: target.name,
        slot,
        dateStr,
        monthStr,
        timeStr,
        year,
        month,
        day,
      });
      const { webhookUrl } = loadSettings();
      if (webhookUrl && actor) {
        let rollNo = "";
        let studentId = "";
        let employeeId = "";
        let nsqfLevel = "";
        let semester = "";
        try {
          const personSummary = await actor.getPersonSummary(target.personId);
          rollNo = personSummary.rollNo ?? "";
          studentId = personSummary.studentId ?? "";
          employeeId = personSummary.employeeId ?? "";
          const batchStr = personSummary.batch ?? "";
          if (batchStr.includes(" - ")) {
            const parts = batchStr.split(" - ");
            nsqfLevel = (parts[0]?.trim() ?? "")
              .replace("NSQF ", "")
              .replace("-", " ");
            semester = parts[1]?.trim() ?? "";
          } else if (batchStr) {
            nsqfLevel = batchStr.trim().replace("NSQF ", "").replace("-", " ");
          }
        } catch (_err) {}
        const payload = new URLSearchParams({
          personId: String(target.personId),
          name: target.name,
          personType: target.personTypeStr,
          rollNo,
          studentId,
          employeeId,
          nsqfLevel,
          semester,
          slot,
          date: dateStr,
          month: monthStr,
          time: timeStr,
          year: String(now.getFullYear()),
          day: String(now.getDate()),
          verificationCount: "",
        });
        fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload.toString(),
        }).catch(() => {});
      } else if (webhookUrl) {
        const payload = new URLSearchParams({
          personId: String(target.personId),
          name: target.name,
          personType: target.personTypeStr,
          rollNo: "",
          studentId: "",
          employeeId: "",
          nsqfLevel: "",
          semester: "",
          slot,
          date: dateStr,
          month: monthStr,
          time: timeStr,
          year: String(now.getFullYear()),
          day: String(now.getDate()),
          verificationCount: "",
        });
        fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload.toString(),
        }).catch(() => {});
      }
      toast.success(
        `✓ Attendance marked for ${target.name} — ${slot} at ${timeStr}`,
      );
      if (!overrideMatch) setAlreadyCheckedIn(true);
    } catch (_e) {
      toast.error("Failed to record attendance");
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleManualMark = async (person: PersonSummary) => {
    const typeStr = person.personType === "student" ? "student" : "employee";
    const fakeMatch: MatchResult = {
      personId: person.id,
      name: person.name,
      personTypeStr: typeStr,
      entry: {
        id: person.id,
        personType: person.personType,
        name: person.name,
        faceDescriptor: [],
      },
    };
    await handleMarkAttendance(fakeMatch);
  };

  const slot = getCurrentSlot();

  const isMatch = scanStatus === "match";
  const bracketColor = isMatch
    ? "oklch(0.72 0.22 145)"
    : "oklch(0.80 0.18 200)";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(35,230,242,0.10)",
                border: "1px solid rgba(35,230,242,0.35)",
              }}
            >
              <ScanFace
                className="w-5 h-5"
                style={{ color: "oklch(0.80 0.18 200)" }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold uppercase tracking-widest neon-text-cyan">
                Biometric Scan
              </h1>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {manualMode
                  ? "Manual Attendance Verification"
                  : "AI-Powered Attendance Verification"}
              </p>
            </div>
            <div
              className="ml-auto px-3 py-1 rounded-full font-orbitron text-xs uppercase tracking-wider"
              style={{
                background: "rgba(35,230,242,0.10)",
                border: "1px solid rgba(35,230,242,0.35)",
                color: "oklch(0.80 0.18 200)",
              }}
            >
              {slot} Slot
            </div>
          </div>
        </div>

        {/* Manual mode banner */}
        {manualMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
            style={{
              background: "rgba(128,96,0,0.15)",
              border: "1px solid rgba(200,160,0,0.3)",
              color: "oklch(0.80 0.18 70)",
            }}
            data-ocid="scan.manual_mode.panel"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            AI not available — select person manually
          </motion.div>
        )}

        {/* AI loading indicator */}
        {!manualMode && (loadingModels || (!modelsLoaded && !camLoading)) && (
          <div
            className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
            style={{
              background: "rgba(35,230,242,0.06)",
              border: "1px solid rgba(35,230,242,0.20)",
              color: "oklch(0.80 0.18 200)",
            }}
            data-ocid="scan.loading_state"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingModels
              ? "Loading AI face recognition models..."
              : "Preparing..."}
            {showManualBtn && !modelsLoaded && (
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="ml-auto text-xs underline underline-offset-2"
                style={{ color: "oklch(0.70 0.10 200)" }}
                data-ocid="scan.manual_mode.button"
              >
                Use Manual Mode
              </button>
            )}
          </div>
        )}

        {/* Camera viewfinder */}
        <div
          className="relative overflow-hidden rounded-xl bracket-expand"
          style={{
            aspectRatio: "4/3",
            background: "#000",
            border: `1px solid ${bracketColor}`,
            boxShadow: `0 0 30px ${isMatch ? "rgba(69,255,122,0.15)" : "rgba(35,230,242,0.12)"}, 0 0 60px ${isMatch ? "rgba(69,255,122,0.05)" : "rgba(35,230,242,0.04)"}`,
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Rotating scan ring when active */}
          {isActive && modelsLoaded && (
            <div
              className="absolute pointer-events-none spin-slow"
              style={{
                inset: "12%",
                borderRadius: "50%",
                border: `1px dashed ${bracketColor}`,
                opacity: 0.25,
              }}
            />
          )}

          {/* Prominent HUD corner brackets */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top-left */}
            <div
              className="absolute top-4 left-4 w-8 h-8"
              style={{
                borderTopWidth: 3,
                borderLeftWidth: 3,
                borderTopStyle: "solid",
                borderLeftStyle: "solid",
                borderColor: bracketColor,
                boxShadow: `0 0 8px ${bracketColor}`,
              }}
            />
            {/* Top-right */}
            <div
              className="absolute top-4 right-4 w-8 h-8"
              style={{
                borderTopWidth: 3,
                borderRightWidth: 3,
                borderTopStyle: "solid",
                borderRightStyle: "solid",
                borderColor: bracketColor,
                boxShadow: `0 0 8px ${bracketColor}`,
              }}
            />
            {/* Bottom-left */}
            <div
              className="absolute bottom-4 left-4 w-8 h-8"
              style={{
                borderBottomWidth: 3,
                borderLeftWidth: 3,
                borderBottomStyle: "solid",
                borderLeftStyle: "solid",
                borderColor: bracketColor,
                boxShadow: `0 0 8px ${bracketColor}`,
              }}
            />
            {/* Bottom-right */}
            <div
              className="absolute bottom-4 right-4 w-8 h-8"
              style={{
                borderBottomWidth: 3,
                borderRightWidth: 3,
                borderBottomStyle: "solid",
                borderRightStyle: "solid",
                borderColor: bracketColor,
                boxShadow: `0 0 8px ${bracketColor}`,
              }}
            />

            {/* Scan line */}
            {isActive && modelsLoaded && (
              <div
                className="absolute left-0 right-0 h-0.5 opacity-60 scan-line"
                style={{
                  background: `linear-gradient(to right, transparent, ${bracketColor}, transparent)`,
                  boxShadow: `0 0 6px ${bracketColor}`,
                }}
              />
            )}

            {/* HUD readouts */}
            {isActive && (
              <div
                className="absolute top-2 left-14 font-mono text-[9px] uppercase tracking-widest opacity-50"
                style={{ color: bracketColor }}
              >
                SCANNING
              </div>
            )}
          </div>

          {/* Flip camera button */}
          {isActive && (
            <button
              type="button"
              onClick={() => switchCamera()}
              className="absolute top-14 right-2 z-10 p-2 rounded-full transition-colors"
              style={{
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(35,230,242,0.3)",
              }}
              data-ocid="scan.toggle"
              aria-label="Switch camera"
            >
              <SwitchCamera className="w-5 h-5 text-white" />
            </button>
          )}

          {camError && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(4,11,20,0.90)" }}
            >
              <div className="text-center space-y-2">
                <AlertCircle
                  className="w-10 h-10 mx-auto"
                  style={{ color: "oklch(0.62 0.22 15)" }}
                />
                <p
                  className="text-sm font-mono"
                  style={{ color: "oklch(0.62 0.22 15)" }}
                >
                  {camError.message}
                </p>
              </div>
            </div>
          )}
          {!isActive && !camLoading && !camError && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(4,11,20,0.85)" }}
            >
              <div className="text-center space-y-2">
                <ScanFace
                  className="w-12 h-12 mx-auto opacity-30"
                  style={{ color: "oklch(0.80 0.18 200)" }}
                />
                <p className="text-sm font-mono text-muted-foreground">
                  Starting camera...
                </p>
              </div>
            </div>
          )}
          {camLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(4,11,20,0.85)" }}
            >
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "oklch(0.80 0.18 200)" }}
              />
            </div>
          )}
        </div>

        {/* AI status panel */}
        {!manualMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 px-4 py-3 rounded-xl flex items-center gap-3 hud-panel"
            data-ocid={
              scanStatus === "match"
                ? "scan.match.success_state"
                : "scan.status.panel"
            }
          >
            {scanStatus === "match" && (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 neon-text-green" />
            )}
            {scanStatus === "unknown" && (
              <AlertCircle
                className="w-5 h-5 flex-shrink-0"
                style={{ color: "oklch(0.80 0.18 70)" }}
              />
            )}
            {(scanStatus === "idle" || scanStatus === "no-face") && (
              <ScanFace className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p
                className="font-semibold font-orbitron uppercase text-sm tracking-wide"
                style={{
                  color:
                    scanStatus === "match"
                      ? "oklch(0.72 0.22 145)"
                      : scanStatus === "unknown"
                        ? "oklch(0.80 0.18 70)"
                        : undefined,
                }}
              >
                {scanStatus === "match" && matchResult
                  ? `MATCH: ${matchResult.name}`
                  : scanStatus === "no-face"
                    ? "NO FACE DETECTED"
                    : scanStatus === "unknown"
                      ? "UNKNOWN FACE"
                      : "INITIALIZING..."}
              </p>
              {matchResult && (
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  TYPE: {matchResult.personTypeStr.toUpperCase()}
                </p>
              )}
            </div>
            {modelsLoaded && isActive && (
              <span
                className="text-xs font-mono neon-flicker"
                style={{ color: "oklch(0.80 0.18 200)" }}
              >
                AI ACTIVE
              </span>
            )}
          </motion.div>
        )}

        {/* Slot grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SLOTS.map((s, i) => {
            const isCurrentSlot = slot === s.name;
            return (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="rounded-lg p-2.5 sm:p-2 text-center text-xs border transition-all"
                style={{
                  background: isCurrentSlot
                    ? "rgba(35,230,242,0.10)"
                    : "rgba(8,18,28,0.55)",
                  borderColor: isCurrentSlot
                    ? "rgba(35,230,242,0.50)"
                    : "rgba(35,230,242,0.18)",
                  color: isCurrentSlot
                    ? "oklch(0.80 0.18 200)"
                    : "oklch(0.78 0.03 220)",
                  boxShadow: isCurrentSlot
                    ? "0 0 12px rgba(35,230,242,0.15)"
                    : "none",
                  fontFamily: isCurrentSlot
                    ? "Orbitron, sans-serif"
                    : undefined,
                }}
              >
                <div className="font-semibold">{s.label}</div>
                <div className="opacity-60 mt-0.5">{s.time}</div>
              </motion.div>
            );
          })}
          {slot === "General" && (
            <div
              className="rounded-lg p-2 text-center text-xs border transition-all col-span-4"
              style={{
                background: "rgba(35,230,242,0.10)",
                borderColor: "rgba(35,230,242,0.50)",
                color: "oklch(0.80 0.18 200)",
                fontFamily: "Orbitron, sans-serif",
              }}
            >
              <div>General</div>
              <div>Outside regular hours</div>
            </div>
          )}
        </div>

        {/* Manual mode: person list */}
        {manualMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-2"
            data-ocid="scan.manual_mode.panel"
          >
            <h2 className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground mb-2">
              Select person to mark attendance:
            </h2>
            {persons.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground text-sm"
                data-ocid="scan.empty_state"
              >
                No registered persons. Register someone first.
              </div>
            ) : (
              persons.map((person, idx) => {
                const isStudent = person.personType === "student";
                return (
                  <div
                    key={String(person.id)}
                    data-ocid={`scan.item.${idx + 1}`}
                    className="flex items-center gap-3 p-3 rounded-xl hud-panel hover:border-primary/50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm font-orbitron"
                      style={{
                        background: "rgba(35,230,242,0.12)",
                        border: "1px solid rgba(35,230,242,0.35)",
                        color: "oklch(0.80 0.18 200)",
                      }}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {person.name}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium font-orbitron uppercase tracking-wide"
                        style={
                          isStudent
                            ? {
                                background: "rgba(35,230,242,0.10)",
                                color: "oklch(0.80 0.18 200)",
                                border: "1px solid rgba(35,230,242,0.25)",
                              }
                            : {
                                background: "rgba(114,64,255,0.10)",
                                color: "oklch(0.72 0.2 280)",
                                border: "1px solid rgba(114,64,255,0.25)",
                              }
                        }
                      >
                        {isStudent ? "Student" : "Employee"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      disabled={markingAttendance}
                      onClick={() => handleManualMark(person)}
                      data-ocid="scan.mark_attendance.button"
                      className="font-orbitron uppercase text-xs tracking-wider"
                      style={{
                        background: "oklch(0.72 0.22 145)",
                        color: "oklch(0.08 0.015 250)",
                        boxShadow: "0 0 12px rgba(69,255,122,0.3)",
                      }}
                    >
                      {markingAttendance ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Mark
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* AI mode: mark attendance button */}
        {!manualMode && scanStatus === "match" && matchResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4"
          >
            {alreadyCheckedIn ? (
              <div
                className="p-3 rounded-xl flex items-center gap-2 hud-panel"
                style={{ borderColor: "rgba(69,255,122,0.30)" }}
                data-ocid="scan.already_checked.success_state"
              >
                <CheckCircle2 className="w-5 h-5 neon-text-green" />
                <span
                  className="text-sm font-orbitron uppercase tracking-wide"
                  style={{ color: "oklch(0.72 0.22 145)" }}
                >
                  Already checked in for {slot} slot
                </span>
              </div>
            ) : (
              <Button
                className="w-full h-12 text-sm font-orbitron uppercase tracking-widest hud-glow-pulse"
                style={{
                  background: "oklch(0.72 0.22 145)",
                  color: "oklch(0.08 0.015 250)",
                  boxShadow: "0 0 24px rgba(69,255,122,0.35)",
                  border: "1px solid rgba(69,255,122,0.5)",
                }}
                onClick={() => handleMarkAttendance()}
                disabled={markingAttendance}
                data-ocid="scan.mark_attendance.button"
              >
                {markingAttendance ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Mark Attendance — {slot}
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
