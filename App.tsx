import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Target,
  Clock,
  Settings,
  Save,
  HardDrive,
  FileCode,
  Wifi,
  WifiOff,
  Lightbulb,
  Award,
  BarChart3,
  ListChecks,
  RefreshCw,
  Download,
  Upload,
  ShieldCheck,
  Database,
  History,
  Eye,
  Play,
  AlertTriangle,
  RotateCw,
  Link,
  RefreshCcw,
  Moon,
  Sun,
} from "lucide-react";
import { z } from "zod";
import {
  AppState,
  Task,
  Project,
  User,
  Idea,
  Kudos,
  OKR,
  Booking,
  PersistentItem,
} from "./types";
import {
  DEFAULT_USERS,
  DEFAULT_CATEGORIES,
  DEFAULT_AGENDA,
  BRAND,
} from "./constants";
import Dashboard from "./components/Dashboard";
import TaskBoard from "./components/TaskBoard";
import ProjectBoard from "./components/ProjectBoard";
import CalendarView from "./components/CalendarView";
import IdeaMatrix from "./components/IdeaMatrix";
import KudosBoard from "./components/KudosBoard";
import OKRBoard from "./components/OKRBoard";
import Masters from "./components/Masters";
import HoursBooking from "./components/HoursBooking";
import ArchiveBoard from "./components/ArchiveBoard";
import { Logo } from "./components/Logo";

const STORAGE_KEY = "epiroc_pulse_v5_final";
const APP_VERSION = "5.7.3";

export const stateSchema = z
  .object({
    version: z.string().optional(),
    tasks: z.array(z.any()).optional(),
    archivedTasks: z.array(z.any()).optional(),
    archivedItems: z.array(z.any()).optional(),
    projects: z.array(z.any()).optional(),
    ideas: z.array(z.any()).optional(),
    kudos: z.array(z.any()).optional(),
    okrs: z.array(z.any()).optional(),
    users: z.array(z.any()).optional(),
    bookings: z.array(z.any()).optional(),
    categories: z.array(z.string()).optional(),
    safetyStatus: z.record(z.string(), z.any()).optional(),
    dailyAgenda: z.record(z.string(), z.string()).optional(),
    lastBackupDate: z.string().optional(),
    deletedItemIds: z.array(z.string()).optional(),
    activeLocks: z.record(z.string(), z.any()).optional(),
    dailyFollowUp: z.array(z.any()).optional(),
    ssqdcc_safety: z.array(z.any()).optional(),
    ssqdcc_sustainability: z.array(z.any()).optional(),
    ssqdcc_quality: z.array(z.any()).optional(),
    ssqdcc_delivery: z.array(z.any()).optional(),
    ssqdcc_cost: z.array(z.any()).optional(),
    ssqdcc_capital: z.array(z.any()).optional(),
    general_notes: z.array(z.any()).optional(),
  })
  .passthrough();

const tabs = [
  { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "calendar", name: "Daily Calendar", icon: <Calendar size={18} /> },
  { id: "tasks", name: "Task Board", icon: <ListChecks size={18} /> },
  { id: "ideas", name: "Improvement Pulse", icon: <Lightbulb size={18} /> },
  { id: "okrs", name: "Strategic Pulse", icon: <Target size={18} /> },
  { id: "projects", name: "Initiatives", icon: <BarChart3 size={18} /> },
  { id: "bookings", name: "Time Logs", icon: <Clock size={18} /> },
  { id: "kudos", name: "Recognition", icon: <Award size={18} /> },
  { id: "masters", name: "Admin", icon: <Settings size={18} /> },
  { id: "archive", name: "Audit Trail", icon: <History size={18} /> },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [safeModeError, setSafeModeError] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("epiroc_dark_mode") === "true";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("epiroc_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("epiroc_dark_mode", "false");
    }
  }, [isDarkMode]);

  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.dailyFollowUp === "string") {
        if (parsed.dailyFollowUp.trim()) {
          parsed.dailyFollowUp = [
            {
              id: Math.random().toString(36).substr(2, 9),
              date: new Date().toISOString().split("T")[0],
              text: parsed.dailyFollowUp,
            },
          ];
        } else {
          parsed.dailyFollowUp = [];
        }
      }
      return {
        ...parsed,
        archivedTasks: parsed.archivedTasks || [],
        archivedItems: parsed.archivedItems || [],
        activeLocks: parsed.activeLocks || {},
        dailyFollowUp: parsed.dailyFollowUp || [],
        ssqdcc_safety: parsed.ssqdcc_safety || [],
        ssqdcc_sustainability: parsed.ssqdcc_sustainability || [],
        ssqdcc_quality: parsed.ssqdcc_quality || [],
        ssqdcc_delivery: parsed.ssqdcc_delivery || [],
        ssqdcc_cost: parsed.ssqdcc_cost || [],
        ssqdcc_capital: parsed.ssqdcc_capital || [],
        general_notes: parsed.general_notes || [],
      };
    }
    return {
      version: APP_VERSION,
      tasks: [],
      archivedTasks: [],
      archivedItems: [],
      projects: [],
      ideas: [],
      kudos: [],
      okrs: [],
      users: DEFAULT_USERS.map((name) => ({ name, capacity: 160 })),
      bookings: [],
      categories: DEFAULT_CATEGORIES,
      safetyStatus: {},
      dailyAgenda: DEFAULT_AGENDA,
      deletedItemIds: [],
      activeLocks: {},
      dailyFollowUp: [],
      ssqdcc_safety: [],
      ssqdcc_sustainability: [],
      ssqdcc_quality: [],
      ssqdcc_delivery: [],
      ssqdcc_cost: [],
      ssqdcc_capital: [],
      general_notes: [],
    };
  });

  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null,
  );
  const [backupDirHandle, setBackupDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastFileHash, setLastFileHash] = useState<string>("");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [needsBackupAuth, setNeedsBackupAuth] = useState(false);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!isReadOnly) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isReadOnly]);

  const performAutoBackup = async () => {
    if (!backupDirHandle || isReadOnly) return;

    const today = new Date().toISOString().split("T")[0];
    if (data.lastBackupDate === today) return;

    try {
      // @ts-ignore
      const permission = await backupDirHandle.queryPermission({
        mode: "readwrite",
      });
      if (permission !== "granted") {
        setNeedsBackupAuth(true);
        return;
      }

      const fileName = `epiroc_daily_snapshot_${today}.json`;
      const newFileHandle = await backupDirHandle.getFileHandle(fileName, {
        create: true,
      });
      // @ts-ignore
      const writable = await newFileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      setData((prev) => ({ ...prev, lastBackupDate: today }));
      setNeedsBackupAuth(false);
    } catch (err) {
      console.error("Auto-backup failed", err);
      setNeedsBackupAuth(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (backupDirHandle) performAutoBackup();
    }, 3000);
    return () => clearTimeout(timer);
  }, [backupDirHandle, data.lastBackupDate]);

  const mergeData = (local: AppState, remote: AppState): AppState => {
    const allDeletedIds = new Set([
      ...(local.deletedItemIds || []),
      ...(remote.deletedItemIds || []),
    ]);

    const mergeById = (a: any[], b: any[]) => {
      const map = new Map();
      (a || []).forEach((item) => {
        if (item && item.id && !allDeletedIds.has(item.id)) {
          map.set(item.id, { ...item });
        }
      });
      (b || []).forEach((item) => {
        if (item && item.id && !allDeletedIds.has(item.id)) {
          const existing = map.get(item.id);
          if (!existing) {
            map.set(item.id, { ...item });
          } else {
            const itemTime = item.updatedAt
              ? new Date(item.updatedAt).getTime()
              : 0;
            const existingTime = existing.updatedAt
              ? new Date(existing.updatedAt).getTime()
              : 0;
            if (itemTime > existingTime) {
              map.set(item.id, { ...existing, ...item });
            }
          }
        }
      });
      return Array.from(map.values());
    };

    return {
      ...remote,
      version: APP_VERSION,
      tasks: mergeById(local.tasks, remote.tasks),
      archivedTasks: mergeById(
        local.archivedTasks || [],
        remote.archivedTasks || [],
      ),
      archivedItems: mergeById(
        local.archivedItems || [],
        remote.archivedItems || [],
      ),
      projects: mergeById(local.projects, remote.projects),
      ideas: mergeById(local.ideas, remote.ideas),
      kudos: mergeById(local.kudos, remote.kudos),
      okrs: mergeById(local.okrs, remote.okrs),
      bookings: mergeById(local.bookings, remote.bookings),
      activeLocks: {
        ...(local.activeLocks || {}),
        ...(remote.activeLocks || {}),
      },
      safetyStatus: {
        ...(local.safetyStatus || {}),
        ...(remote.safetyStatus || {}),
      },
      deletedItemIds: Array.from(allDeletedIds),
      dailyFollowUp: remote.dailyFollowUp || local.dailyFollowUp || [],
      ssqdcc_safety: remote.ssqdcc_safety || local.ssqdcc_safety || [],
      ssqdcc_sustainability:
        remote.ssqdcc_sustainability || local.ssqdcc_sustainability || [],
      ssqdcc_quality: remote.ssqdcc_quality || local.ssqdcc_quality || [],
      ssqdcc_delivery: remote.ssqdcc_delivery || local.ssqdcc_delivery || [],
      ssqdcc_cost: remote.ssqdcc_cost || local.ssqdcc_cost || [],
      ssqdcc_capital: remote.ssqdcc_capital || local.ssqdcc_capital || [],
      general_notes: remote.general_notes || local.general_notes || [],
    };
  };

  const archiveCompleted = () => {
    setData((prev) => {
      const timestamp = new Date().toISOString();
      const archivedItems = [...(prev.archivedItems || [])];

      // Migrate old archivedTasks if exist
      if (prev.archivedTasks && prev.archivedTasks.length > 0) {
        prev.archivedTasks.forEach((t) => {
          archivedItems.push({
            id: t.id,
            type: "Task",
            item: t,
            archivedAt: timestamp,
          });
        });
      }

      let newDeletedIds = [...(prev.deletedItemIds || [])];

      const completedTasks = prev.tasks.filter(
        (t: Task) => t.status === "Completed",
      );
      completedTasks.forEach((t) => {
        archivedItems.push({
          id: t.id,
          type: "Task",
          item: t,
          archivedAt: timestamp,
        });
        newDeletedIds.push(t.id);
      });

      const completedIdeas = prev.ideas.filter(
        (i: Idea) => i.status === "Implemented" || i.status === "Rejected",
      );
      completedIdeas.forEach((i) => {
        archivedItems.push({
          id: i.id,
          type: "Idea",
          item: i,
          archivedAt: timestamp,
        });
        newDeletedIds.push(i.id);
      });

      const completedProjects = prev.projects.filter(
        (p: Project) => p.progress === 100,
      );
      completedProjects.forEach((p) => {
        archivedItems.push({
          id: p.id,
          type: "Project",
          item: p,
          archivedAt: timestamp,
        });
        newDeletedIds.push(p.id);
      });

      const processCalendarList = (
        list: PersistentItem[] | undefined,
        cat: string,
      ) => {
        const toArchive = (list || []).filter((i) => i.completed);
        toArchive.forEach((i) => {
          archivedItems.push({
            id: i.id,
            type: "Calendar",
            category: cat,
            item: i,
            archivedAt: timestamp,
          });
          newDeletedIds.push(i.id);
        });
        return (list || []).filter((i) => !i.completed);
      };

      return {
        ...prev,
        archivedItems,
        archivedTasks: [], // Clear old tasks as they are migrated
        deletedItemIds: Array.from(new Set(newDeletedIds)), // Unique deletes
        tasks: prev.tasks.filter((t: Task) => t.status !== "Completed"),
        ideas: prev.ideas.filter(
          (i: Idea) => i.status !== "Implemented" && i.status !== "Rejected",
        ),
        projects: prev.projects.filter((p: Project) => p.progress !== 100),
        dailyFollowUp: processCalendarList(prev.dailyFollowUp, "Follow-up"),
        ssqdcc_safety: processCalendarList(prev.ssqdcc_safety, "Safety"),
        ssqdcc_sustainability: processCalendarList(
          prev.ssqdcc_sustainability,
          "Sustainability",
        ),
        ssqdcc_quality: processCalendarList(prev.ssqdcc_quality, "Quality"),
        ssqdcc_delivery: processCalendarList(prev.ssqdcc_delivery, "Delivery"),
        ssqdcc_cost: processCalendarList(prev.ssqdcc_cost, "Cost"),
        ssqdcc_capital: processCalendarList(prev.ssqdcc_capital, "Capital"),
        general_notes: processCalendarList(prev.general_notes, "General Notes"),
      };
    });
  };

  const setLock = (itemId: string, userId: string | null) => {
    setData((prev) => {
      const activeLocks = { ...(prev.activeLocks || {}) };
      if (!userId) {
        delete activeLocks[itemId];
      } else {
        activeLocks[itemId] = { userId, timestamp: new Date().toISOString() };
      }
      return { ...prev, activeLocks };
    });
  };

  const parseAndValidateData = (content: string) => {
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      setSafeModeError("Data validation failed: Invalid JSON format.");
      throw new Error("Validation Error: Invalid JSON format.");
    }
    
    // Auto-migrate legacy dailyFollowUp string to array format
    if (typeof parsed.dailyFollowUp === "string") {
      if (parsed.dailyFollowUp.trim()) {
        parsed.dailyFollowUp = [
          {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split("T")[0],
            text: parsed.dailyFollowUp,
          },
        ];
      } else {
        parsed.dailyFollowUp = [];
      }
    }
    
    const result = stateSchema.safeParse(parsed);
    if (!result.success) {
      setSafeModeError(
        "Data validation failed: The loaded file does not match expected format.",
      );
      throw new Error("Validation Error: " + result.error.message);
    }
    setSafeModeError(null);
    return result.data as AppState;
  };

  const linkSharedFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Epiroc Database",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      });
      setFileHandle(handle);
      setIsReadOnly(false);
      const file = await handle.getFile();
      const content = await file.text();
      if (content) {
        const remoteData = parseAndValidateData(content);
        setData((prev) => mergeData(prev, remoteData));
        setLastFileHash(content);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      if (err instanceof Error && err.message.includes("Cross origin")) {
        setSafeModeError(
          "File syncing requires the app to be opened in a new tab. Please click the 'Open in new tab' button in the top right of the preview window."
        );
      } else if (err instanceof Error && err.name !== "AbortError") {
        console.error(err);
      }
    }
  };

  const linkBackupDir = async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      setBackupDirHandle(handle);
      setNeedsBackupAuth(false);
      performAutoBackup();
    } catch (err) {
      if (err instanceof Error && err.message.includes("Cross origin")) {
        setSafeModeError(
          "Backups require the app to be opened in a new tab. Please click the 'Open in new tab' button in the top right of the preview window."
        );
      } else if (err instanceof Error && err.name !== "AbortError") {
        console.error(err);
      }
    }
  };

  const reAuthBackup = async () => {
    if (!backupDirHandle) return;
    try {
      // @ts-ignore
      const permission = await backupDirHandle.requestPermission({
        mode: "readwrite",
      });
      if (permission === "granted") {
        setNeedsBackupAuth(false);
        performAutoBackup();
      }
    } catch (e) {
      linkBackupDir();
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epiroc_manual_export_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const manualSync = async () => {
    if (!fileHandle) return;
    setIsAutoSaving(true);
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();

      const remoteData = parseAndValidateData(content);
      const merged = mergeData(dataRef.current, remoteData);

      const mergedContent = JSON.stringify(merged, null, 2);

      // @ts-ignore
      const writable = await fileHandle.createWritable();
      await writable.write(mergedContent);
      await writable.close();

      setData(merged);
      setLastFileHash(mergedContent);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Manual sync failed", err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  useEffect(() => {
    if (!fileHandle || isReadOnly) return;
    const interval = setInterval(async () => {
      try {
        setIsAutoSaving(true);
        const file = await fileHandle.getFile();
        const content = await file.text();
        if (content !== lastFileHash) {
          const remoteData = parseAndValidateData(content);
          const merged = mergeData(dataRef.current, remoteData);
          setData(merged);
          setLastFileHash(JSON.stringify(merged));
          setLastSyncTime(new Date());
        } else {
          const localContent = JSON.stringify(dataRef.current, null, 2);
          if (localContent !== lastFileHash) {
            // @ts-ignore
            const writable = await fileHandle.createWritable();
            await writable.write(localContent);
            await writable.close();
            setLastFileHash(localContent);
            setLastSyncTime(new Date());
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fileHandle, lastFileHash, isReadOnly]);

  const updateData = (newData: Partial<AppState>) => {
    if (isReadOnly) return;

    setData((prev) => {
      const deletedIds = new Set(prev.deletedItemIds || []);
      const keysToCheck: (keyof AppState)[] = [
        "tasks",
        "projects",
        "ideas",
        "kudos",
        "okrs",
        "bookings",
      ];

      keysToCheck.forEach((key) => {
        if (
          newData[key] &&
          Array.isArray(newData[key]) &&
          Array.isArray(prev[key])
        ) {
          const prevArr = prev[key] as any[];
          const newArr = newData[key] as any[];
          prevArr.forEach((p) => {
            if (p.id && !newArr.some((n) => n.id === p.id)) {
              deletedIds.add(p.id);
            }
          });
        }
      });

      return {
        ...prev,
        ...newData,
        deletedItemIds: Array.from(deletedIds),
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] relative">
      {safeModeError && (
        <div className="bg-red-600 text-white py-2 px-8 flex items-center justify-between text-[11px] font-black uppercase tracking-widest z-[100] shadow-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle size={14} />
            <span>{safeModeError}</span>
          </div>
          <button
            onClick={() => setSafeModeError(null)}
            className="bg-white text-red-600 px-4 py-1 rounded-full flex items-center space-x-2 hover:bg-zinc-100 transition shadow-sm font-black"
          >
            <span>DISMISS</span>
          </button>
        </div>
      )}
      {needsBackupAuth && !isReadOnly && (
        <div className="bg-[#E74C3C] text-white py-2 px-8 flex items-center justify-between text-[11px] font-black uppercase tracking-widest z-[100] shadow-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle size={14} />
            <span>Daily Backup Engine requires authorization</span>
          </div>
          <button
            onClick={reAuthBackup}
            className="bg-white text-[#E74C3C] px-4 py-1 rounded-full flex items-center space-x-2 hover:bg-zinc-100 transition shadow-sm font-black"
          >
            <Play size={10} fill="currentColor" />
            <span>AUTHORIZE SNAPSHOTS</span>
          </button>
        </div>
      )}

      <header
        className="h-32 flex items-center px-8 relative overflow-hidden transition-colors duration-500 text-[#3d4d5b]"
        style={{ backgroundColor: BRAND.YELLOW }}
      >
        <div className="flex flex-col z-10">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="flex items-center space-x-6 ml-1 mt-2 text-[9px] uppercase tracking-[0.25em] font-black opacity-80">
            <span className="flex items-center">
              {fileHandle ? (
                <Wifi size={11} className="mr-2" />
              ) : (
                <WifiOff size={11} className="mr-2" />
              )}
              {fileHandle ? "CONNECTED" : "STANDALONE"}
            </span>
            <span className="flex items-center">
              <ShieldCheck
                size={11}
                className={`mr-2 ${backupDirHandle ? "text-green-700" : ""}`}
              />
              BACKUP: {backupDirHandle ? "ACTIVE" : "OFF"}
            </span>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Dark Mode"
            className="p-3.5 bg-[#3d4d5b]/10 rounded-full hover:bg-[#3d4d5b]/20 transition group"
          >
            {isDarkMode ? (
              <Sun
                size={22}
                className="group-hover:text-yellow-400 transition"
              />
            ) : (
              <Moon
                size={22}
                className="group-hover:text-blue-900 transition"
              />
            )}
          </button>

          {!isReadOnly && (
            <button
              onClick={exportData}
              title="Export System Data"
              className="p-3.5 bg-[#3d4d5b]/10 rounded-full hover:bg-[#3d4d5b]/20 transition group"
            >
              <Download
                size={22}
                className="group-hover:translate-y-0.5 transition"
              />
            </button>
          )}

          {fileHandle ? (
            <div className="flex items-center bg-white/40 pl-2 pr-6 py-1.5 rounded-full border border-black/5 shadow-lg backdrop-blur-sm space-x-4">
              <button
                onClick={manualSync}
                title="Force Refresh & Sync"
                className="px-5 py-2.5 bg-black text-[#FDB913] rounded-full hover:bg-zinc-800 transition shadow-sm flex items-center space-x-2"
              >
                <RotateCw
                  size={14}
                  className={isAutoSaving ? "animate-spin" : ""}
                />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  SYNC NOW
                </span>
              </button>
              <div className="flex flex-col items-end border-r border-black/10 pr-4 py-1">
                <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                  Database
                </span>
                <div className="flex items-center space-x-1.5">
                  {isAutoSaving ? (
                    <RefreshCw size={10} className="animate-spin" />
                  ) : (
                    <Save size={10} />
                  )}
                  <span className="text-[10px] font-black tracking-tighter">
                    {isAutoSaving ? "SYNCING..." : "LIVE"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end py-1">
                <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                  Last Sync
                </span>
                <span className="text-[10px] font-black">
                  {lastSyncTime
                    ? lastSyncTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </span>
              </div>
            </div>
          ) : (
            !isReadOnly && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-white/80 hover:bg-white text-[#3d4d5b] px-6 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-sm flex items-center space-x-2 transition-all border border-black/5"
                  title="Reload Application Data"
                >
                  <RefreshCcw size={16} />
                  <span>MANUAL REFRESH</span>
                </button>
                <button
                  onClick={linkSharedFile}
                  className="bg-[#3d4d5b] text-[#FDB913] hover:brightness-110 px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.25em] shadow-2xl flex items-center space-x-4 transition-all"
                >
                  <FileCode size={20} />
                  <span>ESTABLISH TEAM LINK</span>
                </button>
              </div>
            )
          )}
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto flex min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 px-8 py-5 transition-all border-b-4 ${
                activeTab === tab.id
                  ? "border-[#FDB913] text-black font-black bg-gray-50"
                  : "border-transparent text-gray-400 hover:text-black hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              <span className="text-[11px] uppercase tracking-[0.15em] font-black">
                {tab.name}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full mb-8">
        {activeTab === "dashboard" && <Dashboard state={data} />}
        {activeTab === "calendar" && (
          <CalendarView
            tasks={data.tasks}
            safetyStatus={data.safetyStatus}
            updateSafetyStatus={(newStatus) =>
              updateData({ safetyStatus: newStatus })
            }
            appState={data}
            updateAppState={(updates) => updateData(updates)}
          />
        )}
        {activeTab === "tasks" && (
          <TaskBoard
            readOnly={isReadOnly}
            tasks={data.tasks}
            ideas={data.ideas}
            users={data.users.map((u) => u.name)}
            categories={data.categories}
            projects={data.projects}
            okrs={data.okrs}
            bookings={data.bookings}
            updateTasks={(tasks) => updateData({ tasks })}
            locks={data.activeLocks || {}}
            setLock={setLock}
          />
        )}
        {activeTab === "projects" && (
          <ProjectBoard
            projects={data.projects}
            users={data.users.map((u) => u.name)}
            updateProjects={(projects) => updateData({ projects })}
          />
        )}
        {activeTab === "bookings" && (
          <HoursBooking
            readOnly={isReadOnly}
            bookings={data.bookings}
            tasks={data.tasks}
            projects={data.projects}
            users={data.users.map((u) => u.name)}
            updateBookings={(bookings) => updateData({ bookings })}
          />
        )}
        {activeTab === "okrs" && (
          <OKRBoard
            okrs={data.okrs}
            tasks={data.tasks}
            updateOkrs={(okrs) => updateData({ okrs })}
          />
        )}
        {activeTab === "ideas" && (
          <IdeaMatrix
            ideas={data.ideas}
            tasks={data.tasks}
            users={data.users.map((u) => u.name)}
            updateIdeas={(ideas) => updateData({ ideas })}
            updateTasks={(tasks) => updateData({ tasks })}
          />
        )}
        {activeTab === "kudos" && (
          <KudosBoard
            kudos={data.kudos}
            users={data.users.map((u) => u.name)}
            updateKudos={(kudos) => updateData({ kudos })}
          />
        )}
        {activeTab === "masters" && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div
                  className={`p-4 rounded-xl ${backupDirHandle ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-400"}`}
                >
                  <Database size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    System Snapshot Controller
                  </h3>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                    {backupDirHandle
                      ? `Current Active Path: ${backupDirHandle.name}`
                      : "Establish a daily snapshot target directory for disaster recovery"}
                  </p>
                </div>
              </div>
              <button
                onClick={linkBackupDir}
                className="bg-black text-[#FDB913] px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transition hover:brightness-110"
              >
                {backupDirHandle ? "REMAP TARGET" : "ENABLE SNAPSHOTS"}
              </button>
            </div>
            <Masters
              users={data.users}
              categories={data.categories}
              updateUsers={(users) => updateData({ users })}
              updateCategories={(categories) => updateData({ categories })}
              archiveCompleted={archiveCompleted}
            />
          </div>
        )}
        {activeTab === "archive" && <ArchiveBoard data={data} />}
      </main>

      <footer className="fixed bottom-2 right-4 text-[9px] text-gray-300 font-mono pointer-events-none z-50 mix-blend-multiply">
        Created by: Aditya Shitut
      </footer>
    </div>
  );
};

export default App;
