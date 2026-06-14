import React, { useState } from "react";
import { FarmTask } from "../types";
import {
  CheckSquare,
  Square,
  Clock,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Wrench,
  Droplet,
  Leaf,
  Apple,
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  X,
  AlertCircle
} from "lucide-react";

// Helper function to flag tasks as 'Urgent' if deadline is within next 24 hours and not completed
export const isTaskUrgent = (dueDateStr: string, isCompleted: boolean): boolean => {
  if (isCompleted || !dueDateStr) return false;
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 24;
};

interface TaskManagerProps {
  tasks: FarmTask[];
  onAddTask: (task: Omit<FarmTask, "id" | "farmId">) => void;
  onEditTask: (task: FarmTask) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  isReadonly?: boolean;
}

export default function TaskManager({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  isReadonly = false
}: TaskManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Urgent" | "Completed">("All");
  
  // Form modal/drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FarmTask | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FarmTask["category"]>("General");
  const [dueDate, setDueDate] = useState("");

  const handleOpenAdd = () => {
    if (isReadonly) return;
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setCategory("General");
    // Set a sensible default due date: tomorrow at 08:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    const tzoffset = tomorrow.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(tomorrow.getTime() - tzoffset)).toISOString().slice(0, 16);
    setDueDate(localISOTime);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (task: FarmTask) => {
    if (isReadonly) return;
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setDueDate(task.dueDate || "");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    if (editingTask) {
      onEditTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate
      });
    } else {
      onAddTask({
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate,
        isCompleted: false
      });
    }

    setIsFormOpen(false);
    setEditingTask(null);
  };

  const getCategoryIcon = (cat: FarmTask["category"]) => {
    switch (cat) {
      case "Equipment Maintenance":
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case "Irrigation Scheduling":
        return <Droplet className="w-4 h-4 text-blue-500" />;
      case "Harvesting":
        return <Apple className="w-4 h-4 text-emerald-500" />;
      case "Livestock Feed":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case "Crop Spraying":
        return <Leaf className="w-4 h-4 text-indigo-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-500" />;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === "Completed") {
      matchesStatus = t.isCompleted;
    } else if (statusFilter === "Pending") {
      matchesStatus = !t.isCompleted;
    } else if (statusFilter === "Urgent") {
      matchesStatus = isTaskUrgent(t.dueDate, t.isCompleted);
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate stats
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const urgentCount = tasks.filter((t) => isTaskUrgent(t.dueDate, t.isCompleted)).length;

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div id="mabala-task-manager-dashboard" className="bg-white rounded-xl border p-6 shadow-sm space-y-6">
      {/* Header with Title and Productivity Progress bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <span>📋 Farm Tasks Workspace</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
            Organize work, schedules, irrigation water runs, and field directives
          </p>
        </div>
        
        {/* Progress Mini Status */}
        <div className="flex items-center gap-3">
          <div className="text-right sm:text-left">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Completeness</span>
            <span className="text-[14px] font-extrabold text-indigo-600 block sm:inline-block">
              {completedCount}/{totalCount} Completed ({progressPct}%)
            </span>
          </div>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          
          <button
            onClick={handleOpenAdd}
            disabled={isReadonly}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all bg-indigo-600 hover:bg-indigo-700 active:scale-95 flex items-center gap-1.5 shadow-sm ${
              isReadonly ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Searching and Categorical Filters Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Filter Badges & Search Box */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks (e.g. drip pressure)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "All", label: "All Tasks", count: totalCount, style: "border-slate-200 bg-slate-50 text-slate-700" },
              { id: "Pending", label: "Pending", count: pendingCount, style: "border-amber-200 bg-amber-50/50 text-amber-800" },
              { id: "Urgent", label: "Urgent (24h)", count: urgentCount, style: "border-rose-200 bg-rose-50 text-rose-800 animate-pulse font-black" },
              { id: "Completed", label: "Completed", count: completedCount, style: "border-emerald-200 bg-emerald-50 text-emerald-800" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`cursor-pointer border px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  statusFilter === f.id 
                    ? "bg-slate-900 text-white border-slate-900 shadow-3xs" 
                    : "bg-white hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                  statusFilter === f.id ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters Row */}
        <div className="flex flex-wrap items-center gap-1 border-t pt-2 scrollbar-none overflow-x-auto whitespace-nowrap">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 mr-2">Category:</span>
          {["All", "Equipment Maintenance", "Irrigation Scheduling", "Harvesting", "Livestock Feed", "Crop Spraying", "Other"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all border ${
                categoryFilter === cat 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-3xs"
                  : "bg-white border-slate-150 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task Grid / Structured List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl space-y-2">
            <span className="text-2xl block">🌾</span>
            <p className="text-xs font-semibold text-slate-500">No matching farm tasks identified.</p>
            <p className="text-[10px] text-slate-400 leading-tight max-w-xs mx-auto">
              Create a new task scheduled for irrigation checks, crop runs, tractor maintenance, or animal health care.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isUrgent = isTaskUrgent(task.dueDate, task.isCompleted);
            const dueDateTime = new Date(task.dueDate);
            const formattedDate = isNaN(dueDateTime.getTime()) 
              ? task.dueDate 
              : dueDateTime.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={task.id}
                className={`group p-4 border rounded-xl flex items-start justify-between gap-4 hover:shadow-sm transition-all duration-300 ${
                  task.isCompleted 
                    ? "bg-slate-50/50 border-slate-200 opacity-75" 
                    : isUrgent 
                      ? "bg-rose-50/30 border-rose-200 shadow-sm"
                      : "bg-white border-slate-200"
                }`}
              >
                {/* Left side: Interactive Check and Descriptions Block */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(task.id)}
                    disabled={isReadonly}
                    className={`mt-1 h-5 w-5 rounded border flex items-center justify-center cursor-pointer transition-all ${
                      task.isCompleted
                        ? "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600"
                        : isUrgent
                          ? "bg-rose-50 border-rose-300 text-rose-500 hover:bg-rose-100 animate-pulse"
                          : "bg-white border-slate-300 text-slate-400 hover:border-slate-450"
                    }`}
                  >
                    {task.isCompleted ? <CheckSquare className="w-3.5 h-3.5 font-bold" /> : <Square className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                      <h5 className={`font-bold text-xs ${task.isCompleted ? "line-through text-slate-500" : "text-slate-800"}`}>
                        {task.title}
                      </h5>
                      <span className="flex items-center gap-1 bg-slate-100 text-slate-600 rounded px-1.5 py-0.2 font-black text-[9px] uppercase">
                        {getCategoryIcon(task.category)}
                        <span>{task.category}</span>
                      </span>

                      {/* Flag Tasks as Urgent Badge */}
                      {isUrgent && (
                        <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-1.5 py-0.2 rounded border border-rose-300 animate-pulse flex items-center gap-1 uppercase tracking-wide">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Urgent (Due &lt; 24h)</span>
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] leading-relaxed font-semibold max-w-xl ${task.isCompleted ? "text-slate-400" : "text-slate-600"}`}>
                      {task.description}
                    </p>

                    {/* Date scheduling detail */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{task.isCompleted ? `Completed on ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'time'}` : `Due: ${formattedDate}`}</span>
                    </div>
                  </div>
                </div>

                {/* Right side Actions block */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    disabled={isReadonly}
                    className={`p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer ${
                      isReadonly ? "opacity-30 cursor-not-allowed" : ""
                    }`}
                    title="Edit task parameters"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    disabled={isReadonly}
                    className={`p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer ${
                      isReadonly ? "opacity-30 cursor-not-allowed" : ""
                    }`}
                    title="Delete task permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inline React Form Modal Drawer dialogue portal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl border max-w-md w-full p-6 shadow-2xl relative space-y-4 font-sans animate-fade-in">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h5 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                {editingTask ? "📝 Modify Task Details" : "✨ Schedule New Farm Task"}
              </h5>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-tight">
                Align schedules, specific category objectives, and urgency parameters
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Task Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calibrate pivot irrigation system"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Task Description:
                </label>
                <textarea
                  placeholder="Detail any necessary equipment, targets, or safety steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-white font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="General">General</option>
                    <option value="Equipment Maintenance">Equipment Maintenance</option>
                    <option value="Irrigation Scheduling">Irrigation Scheduling</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Livestock Feed">Livestock Feed</option>
                    <option value="Crop Spraying">Crop Spraying</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Due Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-white font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3.5 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="cursor-pointer px-4 py-2 border rounded-lg font-extrabold hover:bg-slate-50 transition-colors text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-extrabold rounded-lg text-white transition-colors shadow-sm"
                >
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
