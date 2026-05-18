import React, { useState } from "react";
import { Idea, Task } from "../types";
import { Lightbulb, Trash2, Edit2, CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface IdeaMatrixProps {
  ideas: Idea[];
  tasks: Task[];
  users: string[];
  updateIdeas: (ideas: Idea[]) => void;
  updateTasks: (tasks: Task[]) => void;
}

const IdeaMatrix: React.FC<IdeaMatrixProps> = ({
  ideas,
  tasks,
  users,
  updateIdeas,
  updateTasks,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  // Pick chart structure
  // Impact / Value on Y, Effort / Cost on X.
  const quadrants = [
    {
      impact: "High",
      cost: "Low",
      label: "Just do",
      desc: "High Impact, Low Effort (Quick Wins)",
      color: "bg-green-50",
      border: "border-green-200",
      textColor: "text-green-900",
      badgeColor: "bg-green-200 text-green-900",
    },
    {
      impact: "High",
      cost: "High",
      label: "Challenge",
      desc: "High Impact, High Effort (Major Projects)",
      color: "bg-yellow-50",
      border: "border-yellow-200",
      textColor: "text-yellow-900",
      badgeColor: "bg-yellow-200 text-yellow-900",
    },
    {
      impact: "Low",
      cost: "Low",
      label: "Possible",
      desc: "Low Impact, Low Effort (Fill-ins)",
      color: "bg-blue-50",
      border: "border-blue-200",
      textColor: "text-blue-900",
      badgeColor: "bg-blue-200 text-blue-900",
    },
    {
      impact: "Low",
      cost: "High",
      label: "Kill",
      desc: "Low Impact, High Effort (Avoid)",
      color: "bg-red-50",
      border: "border-red-200",
      textColor: "text-red-900",
      badgeColor: "bg-red-200 text-red-900",
    },
  ];

  const handleSaveIdea = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ideaText = formData.get("idea") as string;
    const proposer = formData.get("proposer") as string;
    const impact = formData.get("impact") as "High" | "Low";
    const cost = formData.get("cost") as "High" | "Low";

    if (editingIdea) {
      updateIdeas(
        ideas.map((i) =>
          i.id === editingIdea.id
            ? { ...i, idea: ideaText, proposer, impact, cost, updatedAt: new Date().toISOString() }
            : i
        )
      );
    } else {
      const newIdea: Idea = {
        id: Math.random().toString(36).substr(2, 9),
        idea: ideaText,
        proposer: proposer,
        impact: impact,
        cost: cost,
        status: "New",
        date: new Date().toISOString().split("T")[0],
      };

      // Auto-generate a Task from the Idea
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        category: "Continuous Improvement",
        task: `Improvement: ${ideaText}`,
        owner: proposer,
        project: "",
        status: "Not Started",
        priority: "Medium",
        progress: 0,
        hours: 0,
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        notes: `Auto-generated from Pick Chart. Impact: ${newIdea.impact}, Cost/Effort: ${newIdea.cost}`,
        ideaLink: newIdea.id,
        history: [
          {
            timestamp: new Date().toISOString(),
            change: "Operation initialized from Pick Chart",
          },
        ],
        comments: [],
      };

      updateIdeas([...ideas, newIdea]);
      updateTasks([...tasks, newTask]);
    }

    setShowModal(false);
    setEditingIdea(null);
  };

  const deleteIdea = (id: string) => {
    if (confirm("Delete this idea? (Associated task will remain but lose idea link)")) {
      updateIdeas(ideas.filter((i) => i.id !== id));
    }
  };

  const getTaskStatusIcon = (ideaId: string) => {
    const linkedTask = tasks.find(t => t.ideaLink === ideaId);
    if (!linkedTask) return null;
    if (linkedTask.status === "Completed") {
      return <span title="Linked Task Completed" className="text-green-600 flex items-center space-x-1"><CheckCircle2 size={12} /> <span className="text-[9px]">COMPLETED</span></span>;
    }
    if (linkedTask.status === "On Hold" || linkedTask.status === "Blocked") {
      return <span title={`Linked Task ${linkedTask.status}`} className="text-red-500 flex items-center space-x-1"><AlertCircle size={12} /> <span className="text-[9px]">{linkedTask.status.toUpperCase()}</span></span>;
    }
    return <span title={`Linked Task ${linkedTask.status}`} className="text-blue-500 flex items-center space-x-1"><Circle size={12} /> <span className="text-[9px]">{linkedTask.status.toUpperCase()}</span></span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="bg-[#FDB913] p-3 rounded-lg text-black">
            <Lightbulb size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              Weekly CI Pick Chart
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Prioritization with PICK chart (Impact vs Effort)
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingIdea(null);
            setShowModal(true);
          }}
          className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110"
        >
          Submit New Idea
        </button>
      </div>

      {/* Pick Chart 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-4 h-[650px] relative mt-8">
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-black text-gray-400 tracking-widest flex items-center space-x-2">
          <span>LOW</span>
          <span className="w-16 h-px bg-gray-300"></span>
          <span className="text-gray-800">IMPACT / VALUE</span>
          <span className="w-16 h-px bg-gray-300"></span>
          <span>HIGH</span>
        </div>
        
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-black text-gray-400 tracking-widest flex items-center space-x-2">
          <span>LOW</span>
          <span className="w-16 h-px bg-gray-300"></span>
          <span className="text-gray-800">EFFORT / COST</span>
          <span className="w-16 h-px bg-gray-300"></span>
          <span>HIGH</span>
        </div>

        {quadrants.map((q, idx) => {
          // Backward compatibility for existing 'Medium' data
          const matchingIdeas = ideas.filter((i) => {
            const linkedTask = tasks.find(t => t.ideaLink === i.id);
            const isCompleted = i.status === "Implemented" || i.status === "Rejected" || (linkedTask && linkedTask.status === "Completed");
            if (isCompleted) return false;

            const mappedImpact = i.impact === "Medium" || !i.impact ? "Low" : i.impact;
            const mappedCost = i.cost === "Medium" || !i.cost ? "Low" : i.cost;
            return mappedImpact === q.impact && mappedCost === q.cost;
          });
          
          return (
            <div
              key={idx}
              className={`${q.color} ${q.border} border-2 rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-md`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-2xl font-black uppercase tracking-tight ${q.textColor}`}>
                    {q.label}
                  </h3>
                  <p className={`text-[10px] font-bold tracking-wider uppercase opacity-70 ${q.textColor}`}>
                    {q.desc}
                  </p>
                </div>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${q.badgeColor}`}>
                  {matchingIdeas.length}
                </span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {matchingIdeas.length === 0 ? (
                   <div className="h-full flex items-center justify-center border-2 border-dashed border-black/10 rounded-lg">
                      <span className="text-xs font-bold text-black/30 uppercase tracking-widest">No Items</span>
                   </div>
                ) : matchingIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 group relative hover:border-gray-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-sm font-bold text-gray-800 leading-snug pr-12">
                        {idea.idea}
                      </p>
                      <div className="flex items-center space-x-1 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingIdea(idea);
                            setShowModal(true);
                          }}
                          className="text-gray-400 hover:text-blue-500 bg-gray-50 p-1.5 rounded-md"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => deleteIdea(idea.id)}
                          className="text-gray-400 hover:text-red-500 bg-gray-50 p-1.5 rounded-md"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        By {idea.proposer}
                      </p>
                      {getTaskStatusIcon(idea.id)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                {editingIdea ? "Edit Pulse Idea" : "Propose Improvement"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black font-black text-2xl transition"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveIdea} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  Your Idea / Problem Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="idea"
                  required
                  defaultValue={editingIdea?.idea}
                  className="w-full border border-gray-200 p-4 rounded-lg outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent resize-none text-sm font-medium"
                  rows={4}
                  placeholder="Describe the improvement..."
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Proposed By
                  </label>
                  <select name="proposer" defaultValue={editingIdea?.proposer} className="w-full border border-gray-200 p-3 rounded-lg font-medium text-sm outline-none focus:ring-2 focus:ring-[#FDB913]">
                    {users.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Strategic Impact / Value
                  </label>
                  <select name="impact" defaultValue={editingIdea?.impact || "High"} className="w-full border border-gray-200 p-3 rounded-lg font-medium text-sm outline-none focus:ring-2 focus:ring-[#FDB913]">
                    <option value="High">High (Major benefit)</option>
                    <option value="Low">Low (Minor benefit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Cost / Effort Required
                  </label>
                  <select name="cost" defaultValue={editingIdea?.cost || "Low"} className="w-full border border-gray-200 p-3 rounded-lg font-medium text-sm outline-none focus:ring-2 focus:ring-[#FDB913]">
                    <option value="Low">Low (Easy to implement)</option>
                    <option value="High">High (Hard to implement)</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  className="bg-black text-[#FDB913] px-8 py-3.5 rounded-lg font-black uppercase tracking-widest shadow-xl hover:brightness-110 transition w-full md:w-auto"
                >
                  {editingIdea ? "Save Changes" : "Submit to Pick Chart"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaMatrix;

