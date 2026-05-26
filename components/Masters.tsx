import React, { useState } from "react";
import { User } from "../types";
import {
  Users,
  Tag,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  ArchiveRestore,
  Layers,
  Box,
} from "lucide-react";

interface MastersProps {
  users: User[];
  categories: string[];
  groups?: string[];
  models?: string[];
  updateUsers: (users: User[]) => void;
  updateCategories: (categories: string[]) => void;
  updateGroups?: (groups: string[]) => void;
  updateModels?: (models: string[]) => void;
  archiveCompleted?: () => void;
}

const Masters: React.FC<MastersProps> = ({
  users,
  categories,
  groups = [],
  models = [],
  updateUsers,
  updateCategories,
  updateGroups,
  updateModels,
  archiveCompleted,
}) => {
  const [newUserName, setNewUserName] = useState("");
  const [newUserCap, setNewUserCap] = useState(160);
  const [newCat, setNewCat] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newModel, setNewModel] = useState("");

  const addUser = () => {
    if (newUserName.trim()) {
      updateUsers([
        ...users,
        { name: newUserName.trim(), capacity: newUserCap },
      ]);
      setNewUserName("");
    }
  };

  const addCat = () => {
    if (newCat.trim()) {
      updateCategories([...categories, newCat.trim()]);
      setNewCat("");
    }
  };

  const addGroup = () => {
    if (newGroup.trim() && updateGroups) {
      updateGroups([...groups, newGroup.trim()]);
      setNewGroup("");
    }
  };

  const addModel = () => {
    if (newModel.trim() && updateModels) {
      updateModels([...models, newModel.trim()]);
      setNewModel("");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {archiveCompleted && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-zinc-50 text-blue-600 rounded-xl">
              <ArchiveRestore size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">
                Archive Operations
              </h3>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                Move completed items to cold storage to keep the board clean
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (
                confirm("Are you sure you want to archive all completed tasks?")
              ) {
                archiveCompleted();
              }
            }}
            className="bg-black text-[#FDB913] px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transition hover:brightness-110 whitespace-nowrap"
          >
            Archive Completed Tasks
          </button>
        </div>
      )}

      <div className="bg-white p-8 rounded shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-zinc-900 text-[#FDB913] rounded shadow-inner">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
              Stakeholders
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Active Team Management
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8 p-4 bg-gray-50 rounded border border-gray-100">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded text-sm font-bold outline-none"
              placeholder="e.g. Aditya Shitut"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
              Monthly Capacity (Hrs)
            </label>
            <input
              type="number"
              className="w-full border p-2 rounded text-sm font-bold outline-none"
              value={newUserCap}
              onChange={(e) => setNewUserCap(parseInt(e.target.value))}
            />
          </div>
          <button
            onClick={addUser}
            className="w-full bg-black text-[#FDB913] py-2 rounded font-black text-xs uppercase tracking-widest"
          >
            Add Stakeholder
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {users.map((u) => (
            <div
              key={u.name}
              className="flex justify-between items-center p-4 bg-gray-50 rounded border border-transparent hover:border-[#FDB913]/20 group transition cursor-default"
            >
              <div>
                <span className="font-black text-gray-700 text-sm uppercase tracking-tight block leading-none">
                  {u.name}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  Capacity: {u.capacity}h/mo
                </span>
              </div>
              <button
                onClick={() =>
                  updateUsers(users.filter((x) => x.name !== u.name))
                }
                className="text-red-500 opacity-0 group-hover:opacity-100 transition p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-zinc-900 text-[#FDB913] rounded shadow-inner">
            <Tag size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
              Taxonomy
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Operation Categories
            </p>
          </div>
        </div>

        <div className="flex space-x-2 mb-8 p-4 bg-gray-50 rounded border border-gray-100">
          <input
            type="text"
            className="flex-1 border p-2 rounded text-sm font-bold outline-none"
            placeholder="New category..."
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button
            onClick={addCat}
            className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest"
          >
            Add
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.map((c) => (
            <div
              key={c}
              className="flex justify-between items-center p-4 bg-gray-50 rounded border border-transparent hover:border-[#FDB913]/20 group transition cursor-default"
            >
              <span className="font-black text-gray-700 text-sm uppercase tracking-tight">
                {c}
              </span>
              <button
                onClick={() =>
                  updateCategories(categories.filter((x) => x !== c))
                }
                className="text-red-500 opacity-0 group-hover:opacity-100 transition p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {updateGroups && (
        <div className="bg-white p-8 rounded shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-zinc-900 text-[#FDB913] rounded shadow-inner">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                Groups
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                Production Preparation Groups
              </p>
            </div>
          </div>

          <div className="flex space-x-2 mb-8 p-4 bg-gray-50 rounded border border-gray-100">
            <input
              type="text"
              className="flex-1 border p-2 rounded text-sm font-bold outline-none"
              placeholder="New group..."
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
            />
            <button
              onClick={addGroup}
              className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {groups.map((g) => (
              <div
                key={g}
                className="flex justify-between items-center p-4 bg-gray-50 rounded border border-transparent hover:border-[#FDB913]/20 group transition cursor-default"
              >
                <span className="font-black text-gray-700 text-sm uppercase tracking-tight">
                  {g}
                </span>
                <button
                  onClick={() =>
                    updateGroups(groups.filter((x) => x !== g))
                  }
                  className="text-red-500 opacity-0 group-hover:opacity-100 transition p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {updateModels && (
        <div className="bg-white p-8 rounded shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-zinc-900 text-[#FDB913] rounded shadow-inner">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                Models
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                Production Preparation Models
              </p>
            </div>
          </div>

          <div className="flex space-x-2 mb-8 p-4 bg-gray-50 rounded border border-gray-100">
            <input
              type="text"
              className="flex-1 border p-2 rounded text-sm font-bold outline-none"
              placeholder="New model..."
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
            />
            <button
              onClick={addModel}
              className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {models.map((m) => (
              <div
                key={m}
                className="flex justify-between items-center p-4 bg-gray-50 rounded border border-transparent hover:border-[#FDB913]/20 group transition cursor-default"
              >
                <span className="font-black text-gray-700 text-sm uppercase tracking-tight">
                  {m}
                </span>
                <button
                  onClick={() =>
                    updateModels(models.filter((x) => x !== m))
                  }
                  className="text-red-500 opacity-0 group-hover:opacity-100 transition p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Masters;
