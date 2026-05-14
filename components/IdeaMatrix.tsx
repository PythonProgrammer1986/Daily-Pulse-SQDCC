import React, { useState } from "react";
import { Idea, Task } from "../types";
import { Lightbulb, Trash2 } from "lucide-react";

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

  // Pick chart structure
  // Impact / Value on Y, Effort / Cost on X.
  // High Impact, Low Effort -> Just do (Green)
  // High Impact, High Effort -> Challenge (Yellow)
  // Low Impact, Low Effort -> Possible (Blue)
  // Low Impact, High Effort -> Kill (Red)
  const quadrants = [
    {
      impact: "High",
      cost: "Low",
      label: "Just do",
      color: "bg-[#2ECC71]/20",
      border: "border-[#2ECC71]",
    },
    {
      impact: "High",
      cost: "High",
      label: "Challenge",
      color: "bg-[#FDB913]/20",
      border: "border-[#FDB913]",
    },
    {
      impact: "Low",
      cost: "Low",
      label: "Possible",
      color: "bg-[#3498DB]/20",
      border: "border-[#3498DB]",
    },
    {
      impact: "Low",
      cost: "High",
      label: "Kill",
      color: "bg-[#E74C3C]/20",
      border: "border-[#E74C3C]",
    },
  ];

  const handleSaveIdea = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ideaText = formData.get("idea") as string;
    const proposer = formData.get("proposer") as string;

    const newIdea: Idea = {
      id: Math.random().toString(36).substr(2, 9),
      idea: ideaText,
      proposer: proposer,
      impact: formData.get("impact") as any,
      cost: formData.get("cost") as any,
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
    setShowModal(false);
  };

  const deleteIdea = (id: string) => {
    if (confirm("Delete this idea?")) {
      updateIdeas(ideas.filter((i) => i.id !== id));
    }
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
              Prioritization with pick-chart (Impact vs Effort)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110"
        >
          Submit New Idea
        </button>
      </div>

      {/* Pick Chart 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-4 h-[600px] relative">
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-black text-gray-400 tracking-widest">
          IMPACT / VALUE
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-black text-gray-400 tracking-widest">
          EFFORT / COST
        </div>

        {quadrants.map((q, idx) => {
          // Backward compatibility for existing 'Medium' data (treat Impact Medium as low, Cost Medium as High, for worst case scenario, or just keep them where they land)
          const matchingIdeas = ideas.filter((i) => {
            const mappedImpact =
              i.impact === "Medium" || !i.impact ? "Low" : i.impact;
            const mappedCost = i.cost === "Medium" || !i.cost ? "Low" : i.cost;
            return mappedImpact === q.impact && mappedCost === q.cost;
          });
          return (
            <div
              key={idx}
              className={`${q.color} ${q.border} border-2 rounded-lg p-6 flex flex-col`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase tracking-widest text-gray-900">
                  {q.label}
                </h3>
                <span className="text-sm font-black bg-white/50 px-3 py-1 rounded">
                  {matchingIdeas.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {matchingIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-white p-4 rounded shadow border border-gray-100 group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-gray-800 leading-tight">
                        {idea.idea}
                      </p>
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 bg-white p-1 rounded-full"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                      — {idea.proposer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-[#FDB913] text-black flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Propose Improvement
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="font-black text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveIdea} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Your Idea *
                </label>
                <textarea
                  name="idea"
                  required
                  className="w-full border p-3 rounded outline-none focus:ring-1 focus:ring-black"
                  rows={3}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Proposed By
                  </label>
                  <select name="proposer" className="w-full border p-2 rounded">
                    {users.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div></div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Strategic Impact
                  </label>
                  <select name="impact" className="w-full border p-2 rounded">
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Cost / Effort
                  </label>
                  <select name="cost" className="w-full border p-2 rounded">
                    <option value="Low">Low</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-black text-[#FDB913] px-8 py-3 rounded font-black uppercase tracking-widest shadow-xl"
                >
                  Submit to Pick Chart
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
