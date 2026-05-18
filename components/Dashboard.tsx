import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AppState, Task, Project, SafetyStatusEntry } from "../types";
import { BRAND } from "../constants";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Target,
  Calendar,
  ZoomIn,
  ZoomOut,
  Layers,
  Filter,
  CornerDownRight,
  Search,
} from "lucide-react";
import {
  format,
  differenceInDays,
  endOfMonth,
  endOfYear,
  addMonths,
  eachMonthOfInterval,
  isSameMonth,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  addWeeks,
  isWithinInterval,
  addDays,
  parseISO,
} from "date-fns";

const Dashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const [timelineZoom, setTimelineZoom] = useState<"week" | "month" | "year">(
    "month",
  );
  const [utilizationFilter, setUtilizationFilter] = useState<
    "week" | "month" | "year"
  >("month");
  const [stakeholderFilter, setStakeholderFilter] = useState("All");
  const [waterfallMode, setWaterfallMode] = useState<"timeline" | "hierarchy">(
    "timeline",
  );
  const [waterfallProjectFilter, setWaterfallProjectFilter] =
    useState<string>("all");

  // Safety Analytics Aggregation
  const safetyStats = useMemo(() => {
    const today = new Date();
    const currentMonthData = Object.entries(state.safetyStatus || {}).filter(
      ([date]) => isSameMonth(new Date(date), today),
    );

    const statusCounts = { green: 0, yellow: 0, red: 0 };
    currentMonthData.forEach(([_, val]) => {
      const entry = val as SafetyStatusEntry;
      if (entry && entry.status) statusCounts[entry.status]++;
    });

    return [
      { name: "Safe Ops", value: statusCounts.green || 0 },
      { name: "Risks Noted", value: statusCounts.yellow || 0 },
      { name: "Incidents", value: statusCounts.red || 0 },
    ].filter((s) => s.value > 0 || s.name === "Safe Ops");
  }, [state.safetyStatus]);

  // Enhanced Resource Utilization with Actual Bookings and Standalone Tasks
  const workloadData = useMemo(() => {
    const now = new Date();
    let intervals: Date[] = [];

    if (utilizationFilter === "week") {
      intervals = eachWeekOfInterval({
        start: addWeeks(now, -2),
        end: addWeeks(now, 5),
      });
    } else if (utilizationFilter === "month") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      intervals = eachMonthOfInterval({
        start: yearStart,
        end: addMonths(yearStart, 11),
      });
    } else {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      intervals = [yearStart, new Date(now.getFullYear() + 1, 0, 1)];
    }

    return intervals.map((start) => {
      let end: Date;
      let label: string;

      if (utilizationFilter === "week") {
        end = addWeeks(start, 1);
        label = `W${format(start, "w")}`;
      } else if (utilizationFilter === "month") {
        end = addMonths(start, 1);
        label = format(start, "MMM yy");
      } else {
        end = addMonths(start, 12);
        label = format(start, "yyyy");
      }

      const daysInInterval = Math.max(1, differenceInDays(end, start));

      // Filter users for capacity calculation
      const filteredUsers =
        stakeholderFilter === "All"
          ? state.users
          : state.users.filter((u) => u.name === stakeholderFilter);

      const totalDailyCapacity =
        (filteredUsers.reduce((acc, u) => acc + (u.capacity || 160), 0) * 12) /
        365;
      const intervalCapacity = totalDailyCapacity * daysInInterval;

      let projected = 0;
      let actual = 0;

      // Projected from Projects
      state.projects.forEach((p) => {
        if (p.status === "Completed" || p.status === "Cancelled") return;
        if (stakeholderFilter !== "All" && p.manager !== stakeholderFilter)
          return;

        const pStart = parseISO(p.startDate);
        const pEnd = addDays(parseISO(p.endDate), 1);

        const startOverlap = pStart > start ? pStart : start;
        const endOverlap = pEnd < end ? pEnd : end;

        if (startOverlap < endOverlap) {
          const overlapDays = differenceInDays(endOverlap, startOverlap);
          const totalProjectDays = Math.max(1, differenceInDays(pEnd, pStart));
          projected += ((p.hours || 0) / totalProjectDays) * overlapDays;
        }
      });

      // Projected from Standalone Tasks
      state.tasks.forEach((t) => {
        if (t.status === "Completed" || t.project) return;
        if (stakeholderFilter !== "All" && t.owner !== stakeholderFilter)
          return;

        const tStart = t.startDate
          ? parseISO(t.startDate)
          : parseISO(t.dueDate);
        const tEnd = addDays(parseISO(t.dueDate), 1);

        const startOverlap = tStart > start ? tStart : start;
        const endOverlap = tEnd < end ? tEnd : end;

        if (startOverlap < endOverlap) {
          const overlapDays = differenceInDays(endOverlap, startOverlap);
          const totalTaskDays = Math.max(1, differenceInDays(tEnd, tStart));
          projected += ((t.hours || 0) / totalTaskDays) * overlapDays;
        }
      });

      // Actual from Time Logs
      state.bookings.forEach((b) => {
        if (stakeholderFilter !== "All" && b.userId !== stakeholderFilter)
          return;
        const bDate = parseISO(b.date);
        if (bDate >= start && bDate < end) {
          actual += b.hours || 0;
        }
      });

      return {
        name: label,
        projected: Math.round(projected),
        actual: Math.round(actual),
        capacity: Math.round(intervalCapacity),
      };
    });
  }, [
    state.tasks,
    state.projects,
    state.users,
    state.bookings,
    utilizationFilter,
    stakeholderFilter,
  ]);

  // Waterfall Range Tracking
  const timelineRange = useMemo(() => {
    const now = new Date();
    if (timelineZoom === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfWeek(now), total: 7 };
    }
    if (timelineZoom === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endOfMonth(start);
      return { start, end, total: differenceInDays(end, start) + 1 };
    }
    const start = new Date(now.getFullYear(), 0, 1);
    const end = endOfYear(start);
    return { start, end, total: differenceInDays(end, start) + 1 };
  }, [timelineZoom]);

  // Waterfall Visualization Items with Filter
  const waterfallItems = useMemo(() => {
    let rawItems = [];

    // Apply project filter logic
    if (waterfallMode === "hierarchy") {
      const projects = state.projects.filter((p) => {
        if (waterfallProjectFilter === "all") return p.status !== "Completed";
        if (waterfallProjectFilter === "none") return false;
        return p.id === waterfallProjectFilter;
      });

      projects.forEach((p) => {
        rawItems.push({
          ...p,
          type: "Project",
          name: p.name,
          end: p.endDate,
          progress: p.progress || 0,
        });
        const linkedTasks = state.tasks.filter(
          (t) => t.project === p.id && t.status !== "Completed",
        );
        linkedTasks.forEach((t) => {
          rawItems.push({
            ...t,
            type: "Task",
            name: t.task,
            end: t.dueDate,
            isChild: true,
          });
        });
      });

      if (
        waterfallProjectFilter === "all" ||
        waterfallProjectFilter === "none"
      ) {
        const orphanTasks = state.tasks.filter(
          (t) => !t.project && t.status !== "Completed",
        );
        orphanTasks.forEach((t) => {
          rawItems.push({ ...t, type: "Task", name: t.task, end: t.dueDate });
        });
      }
    } else {
      const filteredTasks = state.tasks.filter((t) => {
        if (t.status === "Completed") return false;
        if (waterfallProjectFilter === "all") return true;
        if (waterfallProjectFilter === "none") return !t.project;
        return t.project === waterfallProjectFilter;
      });

      const filteredProjects = state.projects.filter((p) => {
        if (p.status === "Completed") return false;
        if (waterfallProjectFilter === "all") return true;
        if (waterfallProjectFilter === "none") return false;
        return p.id === waterfallProjectFilter;
      });

      rawItems = [
        ...filteredTasks.map((t) => ({
          ...t,
          type: "Task",
          name: t.task,
          end: t.dueDate,
        })),
        ...filteredProjects.map((p) => ({
          ...p,
          type: "Project",
          name: p.name,
          end: p.endDate,
          progress: p.progress || 0,
        })),
      ];
      rawItems.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
    }

    return rawItems
      .map((item) => {
        const start = new Date(item.startDate);
        const end = new Date(item.end);
        const offset = differenceInDays(start, timelineRange.start);
        const duration = differenceInDays(end, start) + 1;

        const startPct = (offset / timelineRange.total) * 100;
        const widthPct = (duration / timelineRange.total) * 100;

        return {
          ...item,
          startPct: Math.max(0, Math.min(100, startPct)),
          widthPct: Math.max(1, Math.min(100 - startPct, widthPct)),
        };
      })
      .filter(
        (i) => (i.startPct < 100 && i.startPct + i.widthPct > 0) || i.isChild,
      );
  }, [
    state.tasks,
    state.projects,
    timelineRange,
    waterfallMode,
    waterfallProjectFilter,
  ]);

  const rulerTicks = useMemo(() => {
    if (timelineZoom === "year") {
      return eachMonthOfInterval({
        start: timelineRange.start,
        end: timelineRange.end,
      }).map((m) => ({
        label: format(m, "MMM"),
        pos:
          (differenceInDays(m, timelineRange.start) / timelineRange.total) *
          100,
      }));
    }
    const days = eachDayOfInterval({
      start: timelineRange.start,
      end: timelineRange.end,
    });
    return days
      .filter((_, i) => timelineZoom === "week" || i % 5 === 0)
      .map((d) => ({
        label: format(d, timelineZoom === "week" ? "EEE d" : "d MMM"),
        pos:
          (differenceInDays(d, timelineRange.start) / timelineRange.total) *
          100,
      }));
  }, [timelineZoom, timelineRange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Operations",
            value: state.tasks.filter((t) => t.status !== "Completed").length,
            icon: <Briefcase size={20} />,
            color: "bg-black",
          },
          {
            label: "Strategic Focus Areas",
            value: state.okrs.length,
            icon: <Target size={20} />,
            color: "bg-[#FDB913] text-black",
          },
          {
            label: "Current Load",
            value: utilizationFilter.toUpperCase(),
            icon: <Clock size={20} />,
            color: "bg-green-600",
          },
          {
            label: "SSQDCC Open Items",
            value: [
              ...(state.ssqdcc_safety || []),
              ...(state.ssqdcc_sustainability || []),
              ...(state.ssqdcc_quality || []),
              ...(state.ssqdcc_delivery || []),
              ...(state.ssqdcc_cost || []),
              ...(state.ssqdcc_capital || []),
            ]
              .filter((i) => !i.completed)
              .length.toString(),
            icon: <AlertTriangle size={20} />,
            color: "bg-zinc-800",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`${card.color} ${card.color.includes("text-black") ? "" : "text-white"} p-6 rounded shadow-sm flex justify-between items-center transition hover:scale-[1.01]`}
          >
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">
                {card.label}
              </p>
              <p className="text-2xl font-black">{card.value}</p>
            </div>
            <div className="opacity-30">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Layers className="text-[#FDB913]" size={22} />
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                Active Operation Waterfall
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Site Roadmap & Critical Path
              </p>
            </div>
          </div>
          <div className="flex space-x-4 items-center">
            <select
              className="bg-zinc-100 border-none rounded px-3 py-1.5 text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-black"
              value={waterfallProjectFilter}
              onChange={(e) => setWaterfallProjectFilter(e.target.value)}
            >
              <option value="all">All Operations</option>
              <option value="none">Standalone Only</option>
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  PRJ: {p.name}
                </option>
              ))}
            </select>

            <div className="flex bg-zinc-100 p-1 rounded-md items-center">
              <button
                onClick={() => setWaterfallMode("timeline")}
                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded flex items-center space-x-1 transition ${waterfallMode === "timeline" ? "bg-white shadow text-black" : "text-gray-400"}`}
              >
                <span>Timeline</span>
              </button>
              <button
                onClick={() => setWaterfallMode("hierarchy")}
                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded flex items-center space-x-1 transition ${waterfallMode === "hierarchy" ? "bg-white shadow text-black" : "text-gray-400"}`}
              >
                <Filter size={10} />
                <span>Project Hierarchy</span>
              </button>
            </div>
            <div className="flex bg-zinc-100 p-1 rounded-md">
              {(["week", "month", "year"] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setTimelineZoom(z)}
                  className={`px-5 py-2 text-[9px] font-black uppercase rounded transition ${timelineZoom === z ? "bg-black text-[#FDB913] shadow-lg" : "text-gray-400 hover:text-black"}`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative border-l border-zinc-100 ml-4 pb-8 overflow-x-auto custom-scrollbar">
          <div className="h-10 w-full border-b border-zinc-200 relative mb-8 min-w-[1000px]">
            {rulerTicks.map((tick, i) => (
              <div
                key={i}
                className="absolute border-l border-zinc-300 h-3 top-7"
                style={{ left: `${tick.pos}%` }}
              >
                <span className="absolute -top-7 -left-4 text-[9px] font-black text-gray-400 uppercase whitespace-nowrap tracking-tighter">
                  {tick.label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-6 min-w-[1000px]">
            {waterfallItems.length === 0 ? (
              <div className="text-center py-12 text-gray-300 uppercase font-black tracking-[0.2em]">
                No Active Operations Found in Scope
              </div>
            ) : (
              waterfallItems.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="flex items-center mb-2 ml-4">
                    {item.isChild && (
                      <div className="w-4 h-4 mr-2 text-gray-300 flex items-center justify-center">
                        <CornerDownRight size={14} />
                      </div>
                    )}
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mr-2 ${item.type === "Project" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {item.type}
                    </span>
                    <span
                      className={`text-[11px] font-black text-gray-700 tracking-tight transition group-hover:text-black`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="h-7 w-full bg-zinc-50 rounded-r-full relative overflow-hidden group-hover:bg-zinc-100 transition">
                    {rulerTicks.map((t, i) => (
                      <div
                        key={i}
                        className="absolute h-full border-l border-zinc-100 z-0"
                        style={{ left: `${t.pos}%` }}
                      ></div>
                    ))}
                    <div
                      className="absolute top-0 h-full bg-[#FDB913] rounded shadow-sm transition-all duration-700 z-10 hover:brightness-105"
                      style={{
                        left: `${item.startPct}%`,
                        width: `${item.widthPct}%`,
                      }}
                    >
                      <div
                        className="h-full bg-black/10"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference">
                        {item.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <Users className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Resource Utilization
              </h3>
            </div>
            <div className="flex space-x-2 items-center">
              <select
                className="bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-[#FDB913]"
                value={stakeholderFilter}
                onChange={(e) => setStakeholderFilter(e.target.value)}
              >
                <option value="All">All Stakeholders</option>
                {state.users.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
              <div className="flex bg-zinc-100 p-1 rounded-md">
                {(["week", "month", "year"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setUtilizationFilter(f)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase rounded ${utilizationFilter === f ? "bg-black text-[#FDB913]" : "text-gray-400 hover:text-black transition"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f5f5f5"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontWeight: "bold", fill: "#bbb" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#fcfcfc" }}
                  contentStyle={{
                    backgroundColor: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "10px",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "9px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    paddingTop: "20px",
                  }}
                />
                <Bar
                  name="Projected Load"
                  dataKey="projected"
                  fill="#000"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Bar
                  name="Actual Use"
                  dataKey="actual"
                  fill="#FDB913"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                  style={{ transform: "translateX(-7px)" }}
                />
                <Bar
                  name="Capacity Limit"
                  dataKey="capacity"
                  fill="#bbb"
                  fillOpacity={0.2}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Site Safety Snapshot
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
              {format(new Date(), "MMMM yyyy")}
            </span>
          </div>
          <div className="h-[320px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safetyStats}
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {safetyStats.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.name === "Safe Ops"
                          ? "#2ECC71"
                          : entry.name === "Risks Noted"
                            ? "#F39C12"
                            : "#E74C3C"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-6 pl-10 border-l border-zinc-100">
              {safetyStats.map((s, i) => (
                <div key={i} className="flex flex-col group">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest group-hover:text-zinc-600 transition">
                    {s.name}
                  </span>
                  <span className="text-3xl font-black text-zinc-900">
                    {s.value} <span className="text-xs opacity-30">logs</span>
                  </span>
                </div>
              ))}
              <p className="text-[9px] text-zinc-400 italic leading-relaxed pt-2">
                Values aggregated from the monthly safety ledger.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Target className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">
              SSQDCC KPI Performance
            </h3>
          </div>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
            Persistent Issue Tracking
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: "Safety", key: "ssqdcc_safety" },
            { label: "Sustainability", key: "ssqdcc_sustainability" },
            { label: "Quality", key: "ssqdcc_quality" },
            { label: "Delivery", key: "ssqdcc_delivery" },
            { label: "Cost", key: "ssqdcc_cost" },
            { label: "Capital", key: "ssqdcc_capital" },
          ].map((cat) => {
            const items = (state as any)[cat.key] || [];
            const open = items.filter((i: any) => !i.completed).length;
            const closed = items.filter((i: any) => i.completed).length;
            const total = items.length;
            const pct = total === 0 ? 0 : Math.round((closed / total) * 100);

            return (
              <div
                key={cat.key}
                className="bg-zinc-50 p-4 rounded text-center shadow-sm border border-zinc-100 transition hover:shadow-md hover:bg-white"
              >
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">
                  {cat.label}
                </p>
                <div className="text-3xl font-black text-black">{pct}%</div>
                <div className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">
                  Resolution Rate
                </div>

                <div className="mt-5 flex items-center space-x-1">
                  <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between mt-2 pt-2 border-t border-zinc-100 text-[9px] font-black uppercase text-gray-500">
                  <span className="text-zinc-600">{open} Open</span>
                  <span className="text-[#2ECC71]">{closed} Done</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {state.tasks && state.tasks.filter((t) => t.escalated || (t.status !== "Completed" && new Date() > new Date(t.dueDate))).length > 0 && (
        <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-red-500" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight text-red-900">
                Action Required: Escalated & Deviated Operations
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em] bg-red-100 px-3 py-1 rounded-full">
              Attention Needed
            </span>
          </div>
          <div className="space-y-3">
            {state.tasks
              .filter((t) => t.escalated || (t.status !== "Completed" && new Date() > new Date(t.dueDate)))
              .map((t) => {
                const isEscalated = t.escalated;
                const isOverdue = t.status !== "Completed" && new Date() > new Date(t.dueDate);
                return (
                  <div key={t.id} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-gray-900 mb-1">{t.task}</span>
                        {isEscalated && (
                          <span className="text-[9px] font-black uppercase text-white bg-red-500 px-2 py-0.5 rounded tracking-widest">
                            Escalated
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[9px] font-black uppercase text-black bg-[#FDB913] px-2 py-0.5 rounded tracking-widest">
                            Schedule Deviated
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Owner: <span className="font-bold">{t.owner}</span> • Due: <span className={`font-bold ${isOverdue ? "text-red-500" : ""}`}>{t.dueDate}</span>
                      </div>
                      {isEscalated && t.escalationReason && (
                        <div className="text-xs text-red-700 italic mt-2 bg-red-50 p-2 rounded">
                          "{t.escalationReason}"
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="text-xs font-black text-gray-900 mb-1">{t.progress}% Complete</div>
                      <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${t.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      
      {state.kpis && state.kpis.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <Target className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">
                KPI Performance Summary
              </h3>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-gray-900 border border-gray-200 px-3 py-1 rounded bg-gray-50">
                  {state.kpis.reduce((acc, kpi) => acc + (kpi.actualNumber || 0), 0)} / {state.kpis.reduce((acc, kpi) => acc + (kpi.targetNumber || 0), 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="bg-zinc-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    KPI Indicator
                  </th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Monthly Target
                  </th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Latest Update
                  </th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Current Progress (Summary)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {state.kpis.map((kpi) => {
                  const thisMonthLogs = (kpi.dailyLogs || []).filter(l => {
                    const parts = l.date.split("-");
                    if (parts.length !== 3) return false;
                    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                  });
                  const sumTarget = thisMonthLogs.reduce((acc, l) => acc + (l.targetNumber || 0), 0);
                  const sumActual = thisMonthLogs.reduce((acc, l) => acc + (l.actualNumber || 0), 0);
                  const avgMonthProgress = sumTarget > 0
                      ? Math.round((sumActual / sumTarget) * 100)
                      : 0;

                  const lastLog =
                    kpi.dailyLogs && kpi.dailyLogs.length > 0
                      ? kpi.dailyLogs[kpi.dailyLogs.length - 1]
                      : null;
                  return (
                    <tr key={kpi.id} className="hover:bg-zinc-50 transition">
                      <td className="px-5 py-4">
                        <span className="text-sm font-black text-gray-800">
                          {kpi.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-gray-500">
                          {kpi.target}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {lastLog ? (
                          <div>
                            <div className="text-xs font-bold text-gray-900 mb-0.5">
                              {format(new Date(lastLog.date), "MMM d")}
                            </div>
                            <div className="text-[10px] text-gray-500 italic max-w-[200px] truncate">
                              "{lastLog.remarks}"
                            </div>
                          </div>
                        ) : kpi.remarks ? (
                          <div className="text-[10px] text-gray-500 italic max-w-[200px] truncate">
                            "{kpi.remarks}"
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">---</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-48">
                          <div className="flex justify-between items-end text-[10px] font-bold mb-1">
                            <span className="text-gray-400">
                              {sumActual} / {sumTarget}
                            </span>
                            <span className="text-gray-900">{avgMonthProgress}% <span className="text-gray-400 font-normal ml-1">avg</span></span>
                          </div>
                          <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                avgMonthProgress >= 75
                                  ? "bg-green-500"
                                  : avgMonthProgress >= 50
                                    ? "bg-[#FDB913]"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${avgMonthProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
