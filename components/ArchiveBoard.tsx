import React, { useState, useMemo } from "react";
import {
  ArchivedItem,
  AppState,
  Task,
  Idea,
  Project,
  PersistentItem,
} from "../types";
import {
  History,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Lightbulb,
  BarChart3,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface ArchiveBoardProps {
  data: AppState;
}

const ArchiveBoard: React.FC<ArchiveBoardProps> = ({ data }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allItems = useMemo(() => {
    const items: ArchivedItem[] = [...(data.archivedItems || [])];

    // Add active tasks that are completed
    (data.tasks || [])
      .filter((t) => t.status === "Completed")
      .forEach((t) => {
        items.push({
          id: t.id,
          type: "Task",
          item: t,
          archivedAt: t.updatedAt || new Date().toISOString(),
        });
      });

    // Add active ideas that are Implemented or Rejected
    (data.ideas || [])
      .filter((i) => i.status === "Implemented" || i.status === "Rejected")
      .forEach((i) => {
        items.push({
          id: i.id,
          type: "Idea",
          item: i,
          archivedAt: i.updatedAt || new Date().toISOString(),
        });
      });

    // Add active projects that are 100%
    (data.projects || [])
      .filter((p) => p.progress === 100)
      .forEach((p) => {
        items.push({
          id: p.id,
          type: "Project",
          item: p,
          archivedAt: p.updatedAt || new Date().toISOString(),
        });
      });

    // Add calendar items that are completed
    const processCalendar = (
      list: PersistentItem[] | undefined,
      cat: string,
    ) => {
      (list || [])
        .filter((i) => i.completed)
        .forEach((i) => {
          items.push({
            id: i.id,
            type: "Calendar",
            category: cat,
            item: i,
            archivedAt: i.updatedAt || new Date().toISOString(),
          });
        });
    };

    processCalendar(data.dailyFollowUp, "Follow-up");
    processCalendar(data.ssqdcc_safety, "Safety");
    processCalendar(data.ssqdcc_sustainability, "Sustainability");
    processCalendar(data.ssqdcc_quality, "Quality");
    processCalendar(data.ssqdcc_delivery, "Delivery");
    processCalendar(data.ssqdcc_cost, "Cost");
    processCalendar(data.ssqdcc_capital, "Capital");
    processCalendar(data.general_notes, "General Notes");

    // Remove duplicates stringified for safety if same ID somehow exists both active and archived
    const uniqueMap = new Map();
    items.forEach((i) => uniqueMap.set(i.id, i));

    return Array.from(uniqueMap.values()).sort(
      (a, b) =>
        new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime(),
    );
  }, [data]);

  const getIcon = (type: string) => {
    switch (type) {
      case "Task":
        return <ListChecks size={16} className="text-green-500" />;
      case "Idea":
        return <Lightbulb size={16} className="text-yellow-500" />;
      case "Project":
        return <BarChart3 size={16} className="text-blue-500" />;
      case "Calendar":
        return <Calendar size={16} className="text-purple-500" />;
      default:
        return <CheckCircle2 size={16} className="text-gray-500" />;
    }
  };

  const getTitle = (item: ArchivedItem) => {
    if (item.type === "Task") return item.item.task;
    if (item.type === "Idea") return item.item.title;
    if (item.type === "Project") return item.item.name;
    if (item.type === "Calendar") return item.item.text;
    return "Unknown Item";
  };

  const getSubtitle = (item: ArchivedItem) => {
    if (item.type === "Task") return item.item.category;
    if (item.type === "Idea") return item.item.category;
    if (item.type === "Calendar") return item.category;
    return "-";
  };

  const getOwner = (item: ArchivedItem) => {
    if (item.type === "Task") return item.item.owner;
    if (item.type === "Idea") return item.item.submitter;
    if (item.type === "Project") return item.item.owner;
    return "-";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-zinc-900 text-[#FDB913] rounded-xl shadow-inner">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              Audit Trail / Archive
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              Historical record of all completed objectives
            </p>
          </div>
        </div>
        <div className="text-[10px] font-black uppercase bg-zinc-50 border border-zinc-100 px-4 py-2 rounded-lg text-gray-500 tracking-widest">
          {allItems.length} Total Records
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {allItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
            No archived records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-gray-200 text-xs text-gray-500 font-black uppercase tracking-wider">
                  <th className="px-6 py-4 w-10"></th>
                  <th className="px-4 py-4">Title / Name</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Assignee/Owner</th>
                  <th className="px-4 py-4">Archived On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allItems.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr
                      className="hover:bg-zinc-50 transition cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === t.id ? null : t.id)
                      }
                    >
                      <td className="px-6 py-4 text-gray-400">
                        {expandedId === t.id ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          {getIcon(t.type)}
                          <span className="font-bold text-sm text-gray-900 line-clamp-1">
                            {getTitle(t)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {t.type}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-gray-600">
                        {getSubtitle(t)}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-gray-600">
                        {getOwner(t)}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-gray-600">
                        {t.archivedAt
                          ? format(new Date(t.archivedAt), "yyyy-MM-dd HH:mm")
                          : "-"}
                      </td>
                    </tr>
                    {expandedId === t.id && (
                      <tr className="bg-zinc-50/50">
                        <td
                          colSpan={6}
                          className="px-6 py-6 border-b border-gray-100"
                        >
                          <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm">
                            <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">
                              Complete Record Detail
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                              {Object.entries(t.item).map(([key, value]) => {
                                // Skip huge or internal structures if needed, or format them safely
                                if (
                                  key === "history" ||
                                  key === "comments" ||
                                  typeof value === "object"
                                ) {
                                  return null;
                                }
                                return (
                                  <div key={key}>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                                      {key}
                                    </span>
                                    <span className="font-medium text-gray-900 whitespace-pre-wrap">
                                      {String(value) || "-"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {t.type === "Task" &&
                              t.item.history &&
                              t.item.history.length > 0 && (
                                <div className="mt-6 border-t border-gray-100 pt-6">
                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3">
                                    Change History
                                  </span>
                                  <div className="space-y-2">
                                    {(t.item.history as any[]).map((h, i) => (
                                      <div
                                        key={i}
                                        className="text-xs flex space-x-3 text-gray-600 border-l-2 border-gray-200 pl-3"
                                      >
                                        <span className="text-gray-400 whitespace-nowrap">
                                          {format(
                                            new Date(h.date),
                                            "yyyy-MM-dd HH:mm",
                                          )}
                                        </span>
                                        <span>
                                          <span className="font-bold text-gray-900 mr-2">
                                            {h.user}
                                          </span>
                                          {h.action}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveBoard;
