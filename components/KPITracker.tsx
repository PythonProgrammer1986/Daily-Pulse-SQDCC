import React, { useState, useMemo } from "react";
import { KPI, KPIDailyLog } from "../types";
import { Plus, Edit2, Trash2, Target, History, Archive } from "lucide-react";
import { format, getDaysInMonth } from "date-fns";

interface KPITrackerProps {
  kpis: KPI[];
  updateKpis: (kpis: KPI[]) => void;
  archiveKpi?: (kpi: KPI) => void;
}

const KPITracker: React.FC<KPITrackerProps> = ({ kpis, updateKpis, archiveKpi }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  
  // store which KPI and date we are adding a log for
  const [showLogModal, setShowLogModal] = useState<{kpi: KPI; date: Date} | null>(null);

  const monthDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonthCount = getDaysInMonth(today);
    return Array.from({ length: daysInMonthCount }, (_, i) => new Date(year, month, i + 1));
  }, []);

  const handleSaveKpi = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const targetNumber = parseFloat(formData.get("targetNumber") as string) || 0;
    const actualNumber = parseFloat(formData.get("actualNumber") as string) || 0;
    const completion = targetNumber > 0 ? Math.round((actualNumber / Math.abs(targetNumber)) * 100) : 0;
    
    const kpiData: Partial<KPI> = {
      name: formData.get("name") as string,
      target: formData.get("target") as string,
      targetNumber,
      actualNumber,
      completion: Math.min(completion, 100), // restrict to 100 if we just want max 100% or allow over? Let's cap visual progress at 100% in UI.
      remarks: formData.get("remarks") as string,
    };

    if (editingKpi) {
       // if we just edit the KPI
      updateKpis(
        kpis.map((k) => (k.id === editingKpi.id ? { ...k, ...kpiData } : k)),
      );
    } else {
      const newKpi: KPI = {
        id: Math.random().toString(36).substr(2, 9),
        dailyLogs: [],
        ...(kpiData as any),
      };
      updateKpis([...kpis, newKpi]);
    }
    setShowModal(false);
    setEditingKpi(null);
  };
  
  const handleAddDailyLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showLogModal) return;
    const formData = new FormData(e.currentTarget);
    
    const date = formData.get("date") as string; // From the date input
    const targetNumber = parseFloat(formData.get("targetNumber") as string) || 0;
    const actualNumber = parseFloat(formData.get("actualNumber") as string) || 0;
    const progress = targetNumber > 0 ? Math.round((actualNumber / Math.abs(targetNumber)) * 100) : 0;
    const remarks = formData.get("remarks") as string;
    
    const newLog: KPIDailyLog = {
      id: Math.random().toString(36).substr(2, 9),
      date,
      targetNumber,
      actualNumber,
      progress,
      remarks,
    };
    
    updateKpis(
      kpis.map((k) => {
        if (k.id === showLogModal.kpi.id) {
           const updatedLogs = [...(k.dailyLogs || []).filter(l => l.date !== date), newLog].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
           
           // Calculate average % for month
           const thisMonthLogs = updatedLogs.filter(l => {
              const parts = l.date.split("-");
              if (parts.length !== 3) return false;
              const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
           });
           
           const sumTarget = thisMonthLogs.reduce((acc, l) => acc + (l.targetNumber || 0), 0);
           const sumActual = thisMonthLogs.reduce((acc, l) => acc + (l.actualNumber || 0), 0);
           const avgProgress = sumTarget > 0
               ? Math.round((sumActual / sumTarget) * 100)
               : 0;

           return {
             ...k,
             targetNumber,
             actualNumber,
             completion: avgProgress, // update completion to average % for month
             remarks: remarks, // update latest remarks
             dailyLogs: updatedLogs
           };
        }
        return k;
      })
    );
    setShowLogModal(null);
  };

  const handleDelete = (id: string) => {
    updateKpis(kpis.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          KPI Performance Tracker
        </h2>
        <button
          onClick={() => {
            setEditingKpi(null);
            setShowModal(true);
          }}
          className="bg-black text-[#FDB913] px-6 py-2 rounded-md font-bold flex items-center space-x-2 hover:bg-[#222] transition"
        >
          <Plus size={20} />
          <span>ADD KPI</span>
        </button>
      </div>

      <div className="bg-white rounded border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap min-w-max">
          <thead className="bg-zinc-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">
                KPI Header
              </th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">
                Target
              </th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">
                Dates
              </th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">
                % of Completion
              </th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {kpis.map((kpi) => {
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

              return (
                <tr key={kpi.id} className="hover:bg-zinc-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#FDB913]/20 p-2 rounded text-[#FDB913]">
                        <Target size={18} />
                      </div>
                      <span className="font-bold text-gray-900">
                        {kpi.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-500 border border-gray-200 bg-white px-2 py-1 rounded">
                      {kpi.target}
                    </span>
                  </td>
                  <td className="px-6 py-4 bg-gray-50/30">
                    <div className="flex space-x-1 overflow-x-auto custom-scrollbar pb-2 min-w-[280px] max-w-[450px]">
                      {monthDays.map(day => {
                        const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
                        const log = kpi.dailyLogs?.find(l => {
                          const logParts = l.date.split("-");
                          if (logParts.length !== 3) return false;
                          const logDay = parseInt(logParts[2], 10);
                          const logMonth = parseInt(logParts[1], 10) - 1;
                          const logYear = parseInt(logParts[0], 10);
                          return logDay === day.getDate() && logMonth === day.getMonth() && logYear === day.getFullYear();
                        });
                        return (
                           <div 
                             key={day.toISOString()}
                             onClick={() => setShowLogModal({ kpi, date: day })}
                             className={`shrink-0 min-w-[48px] h-14 flex flex-col items-center justify-center rounded border cursor-pointer hover:bg-gray-50 transition ${log ? "border-green-200 bg-green-50" : isToday ? "border-[#FDB913] bg-yellow-50" : "border-gray-100 bg-white"}`}
                           >
                             <span className="text-[10px] font-bold text-gray-500 mb-0.5">{format(day, 'd MMM')}</span>
                             <span className={`text-xs font-black ${log ? "text-green-700" : "text-gray-300"}`}>{log ? (log.actualNumber ?? "-") : "-"}</span>
                           </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-48">
                      <div className="flex justify-between items-end text-[10px] font-bold mb-1">
                        <span className="text-gray-400">
                          {sumActual} / {sumTarget}
                        </span>
                        <span className="text-gray-900">{avgMonthProgress}% <span className="text-gray-400 font-normal ml-1">avg</span></span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
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
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowLogModal({ kpi, date: new Date() })}
                        className="p-2 border border-gray-200 text-green-600 hover:bg-green-50 rounded transition"
                        title="Add Daily Log for Today"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingKpi(kpi);
                          setShowModal(true);
                        }}
                        className="p-2 border border-gray-200 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit KPI Metadata"
                      >
                        <Edit2 size={16} />
                      </button>
                      {archiveKpi && (
                        <button
                          onClick={() => {
                              archiveKpi(kpi);
                          }}
                          className="p-2 border border-gray-200 text-purple-600 hover:bg-purple-50 rounded transition"
                          title="Archive KPI"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(kpi.id)}
                        className="p-2 border border-gray-200 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete KPI"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDB913]">
              <h2 className="text-xl font-bold">
                {editingKpi ? "Edit KPI Metadata" : "New KPI"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-black font-bold text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveKpi} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  KPI Name *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingKpi?.name}
                  className="w-full border border-gray-200 rounded px-3 py-2"
                  placeholder="e.g. Safety Reporting Frequency"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Target Description *
                </label>
                <input
                  name="target"
                  required
                  defaultValue={editingKpi?.target}
                  className="w-full border border-gray-200 rounded px-3 py-2"
                  placeholder="e.g. 10 reports per week"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Monthly Target Amount (Qty)
                  </label>
                  <input
                    type="number"
                    name="targetNumber"
                    defaultValue={editingKpi?.targetNumber || 0}
                    className="w-full border border-gray-200 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Initial Actual Amount (Qty)
                  </label>
                  <input
                    type="number"
                    name="actualNumber"
                    defaultValue={editingKpi?.actualNumber || 0}
                    className="w-full border border-gray-200 rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Initial Remarks
                </label>
                <textarea
                  name="remarks"
                  rows={2}
                  defaultValue={editingKpi?.remarks}
                  className="w-full border border-gray-200 rounded px-3 py-2"
                  placeholder="Initial observations..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-200 rounded font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-[#FDB913] rounded font-bold uppercase"
                >
                  Save KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border-t-4 border-black">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDB913]">
              <div>
                <h2 className="text-xl font-bold">Add Daily Log</h2>
                <p className="text-xs text-black/70 font-bold uppercase tracking-wider">{showLogModal.kpi.name} - {format(showLogModal.date, "MMM d, yyyy")}</p>
              </div>
              <button
                onClick={() => setShowLogModal(null)}
                className="text-black font-bold text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddDailyLog} className="p-6 space-y-4">
              {(() => {
                const existingLog = showLogModal?.kpi.dailyLogs?.find((l) => {
                  const logParts = l.date.split("-");
                  if (logParts.length !== 3) return false;
                  return (
                    parseInt(logParts[2], 10) === showLogModal.date.getDate() &&
                    parseInt(logParts[1], 10) - 1 === showLogModal.date.getMonth() &&
                    parseInt(logParts[0], 10) === showLogModal.date.getFullYear()
                  );
                });
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Log Date *
                        </label>
                        <input
                          type="date"
                          name="date"
                          required
                          defaultValue={showLogModal?.date ? format(showLogModal.date, "yyyy-MM-dd") : new Date().toISOString().split("T")[0]}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Target for this Date (Qty)
                        </label>
                        <input
                          type="number"
                          name="targetNumber"
                          defaultValue={existingLog?.targetNumber ?? showLogModal?.kpi.targetNumber ?? 0}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Actual for this Date (Qty)
                        </label>
                        <input
                          type="number"
                          name="actualNumber"
                          defaultValue={existingLog?.actualNumber ?? showLogModal?.kpi.actualNumber ?? 0}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Remarks / Details *
                      </label>
                      <textarea
                        name="remarks"
                        required
                        rows={4}
                        defaultValue={existingLog?.remarks ?? ""}
                        className="w-full border border-gray-200 rounded px-3 py-2"
                        placeholder="Detail today's progress or blockers..."
                      ></textarea>
                    </div>
                  </>
                );
              })()}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowLogModal(null)}
                  className="px-6 py-2 border border-gray-200 rounded font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded font-bold uppercase"
                >
                  Add Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPITracker;
