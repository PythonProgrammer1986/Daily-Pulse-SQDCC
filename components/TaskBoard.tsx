import React, { useState, useMemo } from "react";
import { Task, Status, Priority, OKR, Booking, Idea } from "../types";
import {
  Plus,
  Trash2,
  Search,
  Target,
  Clock,
  AlertTriangle,
  ListChecks,
  History,
  Link,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

interface TaskBoardProps {
  tasks: Task[];
  users: string[];
  categories: string[];
  projects: any[];
  okrs: OKR[];
  ideas?: Idea[];
  bookings: Booking[];
  readOnly?: boolean;
  updateTasks: (tasks: Task[]) => void;
  locks: Record<string, any>;
  setLock: (itemId: string, userId: string | null) => void;
}

// Strictly ordered hierarchy as requested
const CATEGORY_ORDER = [
  "Safety",
  "Sustainability",
  "Quality",
  "Delivery",
  "Cost",
  "Capital",
  "Priority",
  "Support Required",
  "Short Term Action",
  "Information & Team Suggestions",
  "Problem Solving",
  "Continuous Improvement",
  "Strategic Initiatives & Action Plans",
];

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  users,
  categories,
  projects,
  okrs,
  ideas = [],
  bookings,
  readOnly,
  updateTasks,
  locks,
  setLock,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("All");
  const [filterQuick, setFilterQuick] = useState<"All" | "Weekly Improvement" | "Initiatives">("All");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"details" | "history">(
    "details",
  );

  const deviceId = React.useRef(
    Math.random().toString(36).substr(2, 9),
  ).current;
  const [tempProgress, setTempProgress] = useState(0);
  const [selectedOkrId, setSelectedOkrId] = useState<string>("");

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((t) => {
      const matchSearch =
        t.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchOwner = filterOwner === "All" || t.owner === filterOwner;
      
      let matchQuick = true;
      if (filterQuick === "Weekly Improvement") {
        matchQuick = !!t.ideaLink && t.status !== "Completed";
      } else if (filterQuick === "Initiatives") {
        matchQuick = !!t.project || t.category === "Strategic Initiatives & Action Plans";
      }

      return matchSearch && matchOwner && matchQuick;
    });

    // Custom Sort by Taxonomy Category Hierarchy
    return result.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.category);
      const indexB = CATEGORY_ORDER.indexOf(b.category);

      const valA = indexA === -1 ? 999 : indexA;
      const valB = indexB === -1 ? 999 : indexB;

      if (valA !== valB) return valA - valB;
      // Secondary sort alphabetically if categories are identical
      return a.task.localeCompare(b.task);
    });
  }, [tasks, searchTerm, filterOwner, filterQuick]);

  const closeModal = () => {
    if (editingTask?.id) {
      setLock(editingTask.id, null);
    }
    setShowModal(false);
    setEditingTask(null);
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    if (readOnly) return;
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskData: Partial<Task> = {
      task: formData.get("task") as string,
      owner: formData.get("owner") as string,
      category: formData.get("category") as string,
      project: formData.get("project") as string,
      status: formData.get("status") as Status,
      priority: formData.get("priority") as Priority,
      progress: tempProgress,
      hours: parseFloat(formData.get("hours") as string) || 0,
      startDate: formData.get("startDate") as string,
      dueDate: formData.get("dueDate") as string,
      okrLink: formData.get("okrLink") as string,
      keyResultLink: formData.get("keyResultLink") as string,
      ideaLink: formData.get("ideaLink") as string,
      notes: formData.get("notes") as string,
      escalated: formData.get("escalated") === "true",
      escalationReason: formData.get("escalationReason") as string,
      updatedAt: new Date().toISOString(),
    };

    if (editingTask) {
      const history = [...(editingTask.history || [])];
      if (editingTask.status !== taskData.status) {
        history.push({
          timestamp: new Date().toISOString(),
          change: `Status transitioned to ${taskData.status}`,
        });
      }
      updateTasks(
        tasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...taskData,
                history,
                originalDueDate:
                  editingTask.originalDueDate || taskData.dueDate,
              }
            : t,
        ),
      );
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        history: [
          {
            timestamp: new Date().toISOString(),
            change: "Operation initialized",
          },
        ],
        comments: [],
        originalDueDate: taskData.dueDate,
        ...(taskData as any),
      };
      updateTasks([...tasks, newTask]);
    }
    closeModal();
  };

  const handleDeleteTask = (taskId: string) => {
    if (readOnly) return;
    if (
      confirm(
        "Are you sure you want to permanently delete this operation? This cannot be undone.",
      )
    ) {
      updateTasks(tasks.filter((t) => t.id !== taskId));
      if (editingTask?.id === taskId) {
        setLock(taskId, null);
      }
      closeModal();
    }
  };

  const getActualHours = (taskId: string) => {
    return bookings
      .filter((b) => b.targetId === taskId)
      .reduce((acc, b) => acc + b.hours, 0);
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Blocked":
        return "bg-red-100 text-red-800";
      case "On Hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const openEdit = (task: Task | null) => {
    if (task?.id) {
      setLock(task.id, deviceId);
    }
    setEditingTask(task);
    setTempProgress(task ? task.progress : 0);
    setSelectedOkrId(task ? task.okrLink || "" : "");
    setActiveSubTab("details");
    setShowModal(true);
  };

  const activeOkr = okrs.find((o) => o.id === selectedOkrId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search operations..."
              className="w-full pl-10 pr-4 py-3 border border-zinc-100 bg-zinc-50 rounded font-bold text-sm outline-none focus:bg-white focus:ring-1 focus:ring-black transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-zinc-100 bg-zinc-50 rounded px-4 py-3 text-xs font-black uppercase tracking-widest outline-none"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="All">All Stakeholders</option>
            {users.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterQuick(filterQuick === "Weekly Improvement" ? "All" : "Weekly Improvement")}
            className={`px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition border ${
              filterQuick === "Weekly Improvement" 
                ? "bg-black text-[#FDB913] border-black shadow-md"
                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Weekly Improvement
          </button>
          <button
            onClick={() => setFilterQuick(filterQuick === "Initiatives" ? "All" : "Initiatives")}
            className={`px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition border ${
              filterQuick === "Initiatives" 
                ? "bg-black text-[#FDB913] border-black shadow-md"
                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            Initiatives
          </button>
        </div>
        {!readOnly && (
          <button
            onClick={() => openEdit(null)}
            className="bg-black text-[#FDB913] px-8 py-3 rounded font-black text-xs uppercase tracking-widest shadow-xl transition hover:brightness-110"
          >
            Initiate New Operation
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Operation Detail
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Stakeholder
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Duration (Est)
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Burn Efficiency
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-300 font-black uppercase text-xs tracking-widest"
                >
                  No matching operations found
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => {
                const actual = getActualHours(t.id);
                const est = t.hours || 0;
                const burnPct =
                  est > 0 ? Math.min(100, (actual / est) * 100) : 0;

                const currentLock = locks[t.id];
                const isLockedOther =
                  currentLock &&
                  currentLock.userId &&
                  currentLock.userId !== deviceId;

                const isDeviated = t.status !== "Completed" && new Date() > new Date(t.dueDate);
                const isEscalated = t.escalated;

                return (
                  <tr
                    key={t.id}
                    className={`transition group ${isLockedOther ? "bg-zinc-50 opacity-60 cursor-not-allowed" : "hover:bg-zinc-50 cursor-pointer"} ${isEscalated ? "border-l-4 border-l-red-500 bg-red-50" : isDeviated ? "border-l-4 border-l-[#FDB913] bg-yellow-50/50" : ""}`}
                    onClick={() => {
                      if (!isLockedOther) {
                        openEdit(t);
                      }
                    }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        {isLockedOther && (
                          <Lock
                            className="text-red-500 shrink-0"
                            size={14}
                            title={`Locked by another user`}
                          />
                        )}
                        {(isEscalated || isDeviated) && (
                          <AlertTriangle 
                            size={16} 
                            className={`shrink-0 ${isEscalated ? "text-red-500" : "text-[#FDB913]"}`} 
                            title={isEscalated ? `Escalated: ${t.escalationReason || "No reason given"}` : "Schedule Deviated (Overdue)"}
                          />
                        )}
                        <p className="font-black text-zinc-900 text-sm leading-tight mb-1">
                          {t.task}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[8px] font-black uppercase bg-zinc-900 text-yellow-500 px-2 py-0.5 rounded tracking-tighter">
                          {t.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusColor(t.status)}`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-black text-zinc-700 uppercase">
                      {t.owner}
                    </td>
                    <td className="px-6 py-5 text-xs font-black text-zinc-900">
                      {est} Hrs
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${actual > est && est > 0 ? "bg-red-500" : "bg-[#FDB913]"}`}
                            style={{ width: `${burnPct}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-400">
                          {actual}h Actual
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-zinc-900">
                          {t.progress}%
                        </span>
                        <div className="w-24 bg-zinc-100 h-1.5 rounded-full mt-1.5">
                          <div
                            className="bg-black h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${t.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 bg-[#FDB913] text-black flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {editingTask ? "Edit Operation" : "Initiate Operation"}
                </h2>
                <p className="text-[10px] font-black uppercase opacity-60">
                  Epiroc Management Console
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="font-black text-3xl hover:rotate-90 transition-all duration-300"
              >
                ×
              </button>
            </div>

            <div className="flex bg-zinc-50 border-b shrink-0 px-8">
              <button
                onClick={() => setActiveSubTab("details")}
                className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 ${activeSubTab === "details" ? "border-b-4 border-black text-black bg-white" : "text-gray-400 hover:text-black"}`}
              >
                <ListChecks size={14} />
                <span>Operational Parameters</span>
              </button>
              {editingTask && (
                <button
                  onClick={() => setActiveSubTab("history")}
                  className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 ${activeSubTab === "history" ? "border-b-4 border-black text-black bg-white" : "text-gray-400 hover:text-black"}`}
                >
                  <History size={14} />
                  <span>Audit Trail</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {activeSubTab === "details" ? (
                <form
                  id="taskForm"
                  onSubmit={handleSaveTask}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                        Operational Description *
                      </label>
                      <input
                        name="task"
                        required
                        defaultValue={editingTask?.task}
                        className="w-full border-b-2 border-zinc-100 p-3 bg-zinc-50 text-lg font-black outline-none focus:border-[#FDB913] focus:bg-white transition"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                        Stakeholder Owner *
                      </label>
                      <select
                        name="owner"
                        required
                        defaultValue={editingTask?.owner}
                        className="w-full border p-3 rounded font-bold outline-none"
                        disabled={readOnly}
                      >
                        {users.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                        Estimated Duration (Total Hrs)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        name="hours"
                        defaultValue={editingTask?.hours || 0}
                        className="w-full border p-3 rounded font-black text-zinc-900 outline-none"
                        readOnly={readOnly}
                        placeholder="e.g. 40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                        Operational Status
                      </label>
                      <select
                        name="status"
                        defaultValue={editingTask?.status || "Not Started"}
                        className="w-full border p-3 rounded font-black outline-none"
                        disabled={readOnly}
                      >
                        {[
                          "Not Started",
                          "In Progress",
                          "Completed",
                          "Blocked",
                          "On Hold",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          Target Progress (%)
                        </label>
                        <span className="text-[11px] font-black text-white bg-black px-3 py-1 rounded-full">
                          {tempProgress}%
                        </span>
                      </div>
                      <input
                        type="range"
                        name="progress"
                        min="0"
                        max="100"
                        value={tempProgress}
                        onChange={(e) =>
                          setTempProgress(parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-[#FDB913] mt-2"
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={editingTask?.startDate}
                        className="w-full border p-3 rounded font-bold outline-none"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        defaultValue={editingTask?.dueDate}
                        className="w-full border p-3 rounded font-bold outline-none"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                        Taxonomy Category
                      </label>
                      <select
                        name="category"
                        defaultValue={editingTask?.category}
                        className="w-full border p-3 rounded font-bold outline-none"
                        disabled={readOnly}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Strategic Alignment Section */}
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-black mb-4 flex items-center space-x-2">
                      <Link size={14} />
                      <span>Strategic Alignment (Optional)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                          Link to Project
                        </label>
                        <select
                          name="project"
                          defaultValue={editingTask?.project || ""}
                          className="w-full border p-3 rounded font-bold outline-none text-xs"
                          disabled={readOnly}
                        >
                          <option value="">-- No Project Link --</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                          Link to Improvement
                        </label>
                        <select
                          name="ideaLink"
                          defaultValue={editingTask?.ideaLink || ""}
                          className="w-full border p-3 rounded font-bold outline-none text-xs"
                          disabled={readOnly}
                        >
                          <option value="">-- No Improvement Link --</option>
                          {ideas.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.idea.substring(0, 30)}...
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                          Link to OKR
                        </label>
                        <select
                          name="okrLink"
                          value={selectedOkrId}
                          onChange={(e) => setSelectedOkrId(e.target.value)}
                          className="w-full border p-3 rounded font-bold outline-none text-xs"
                          disabled={readOnly}
                        >
                          <option value="">-- No OKR Link --</option>
                          {okrs.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.objective}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                          Target Key Result
                        </label>
                        <select
                          name="keyResultLink"
                          defaultValue={editingTask?.keyResultLink || ""}
                          className="w-full border p-3 rounded font-bold outline-none text-xs disabled:bg-gray-100"
                          disabled={readOnly || !selectedOkrId}
                        >
                          <option value="">
                            -- Select Specific Key Result --
                          </option>
                          {activeOkr?.keyResults.map((kr) => (
                            <option key={kr.id} value={kr.id}>
                              {kr.kr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#FDB913] mb-4 flex items-center space-x-2">
                      <AlertTriangle size={14} />
                      <span>Issue Escalation</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          name="escalated" 
                          id="escalated"
                          value="true"
                          defaultChecked={editingTask?.escalated}
                          className="w-4 h-4"
                          disabled={readOnly}
                        />
                        <label htmlFor="escalated" className="text-sm font-bold text-gray-700">Flag as Escalated Operation</label>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                          Reason for Escalation
                        </label>
                        <input
                          type="text"
                          name="escalationReason"
                          defaultValue={editingTask?.escalationReason || ""}
                          placeholder="Why is this operation escalated?"
                          className="w-full border p-3 rounded font-bold outline-none text-xs"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {editingTask?.history?.map((entry, idx) => (
                    <div key={idx} className="flex space-x-6">
                      <div className="w-28 shrink-0 text-[10px] font-black text-gray-400 mt-1 uppercase tracking-tighter">
                        {format(new Date(entry.timestamp), "MMM d, HH:mm")}
                      </div>
                      <div className="flex-1 pb-6 border-l-2 border-zinc-100 pl-8 relative">
                        <div className="absolute w-3 h-3 rounded-full bg-black -left-[7px] top-0 border-4 border-white"></div>
                        <p className="text-xs font-black text-zinc-800 uppercase tracking-tight">
                          {entry.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!readOnly && (
              <div className="p-8 border-t bg-zinc-50 flex justify-between items-center shrink-0">
                {editingTask && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded transition flex items-center space-x-2"
                  >
                    <Trash2 size={14} />
                    <span>Delete Operation</span>
                  </button>
                )}
                {!editingTask && <div></div>} {/* Spacer */}
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="taskForm"
                    className="px-12 py-4 bg-black text-[#FDB913] rounded-full font-black uppercase text-xs tracking-widest shadow-2xl transition hover:brightness-110"
                  >
                    Commit Operation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
