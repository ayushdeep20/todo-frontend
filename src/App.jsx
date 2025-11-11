import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://todo-backend-7v02.onrender.com";

export default function App() {

  const [tasks, setTasks] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDateTime, setNewDateTime] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [editingTask, setEditingTask] = useState(null);

  const [openWeeks, setOpenWeeks] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(`${API}/tasks`)
      .then(res => setTasks(res.data))
      .catch(err => console.log(err));
  }, []);

  function startOfWeekMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDateRange(tasksForWeek) {
    const first = startOfWeekMonday(tasksForWeek[0].datetime);
    const last = new Date(first);
    last.setDate(first.getDate() + 6);
    const options = { month: "short", day: "numeric" };
    return `${first.toLocaleDateString(undefined, options)} - ${last.toLocaleDateString(undefined, options)}`;
  }

  function groupByWeek(taskList) {
    const map = {};
    taskList.forEach(task => {
      const weekStart = startOfWeekMonday(task.datetime).toISOString().slice(0, 10);
      if (!map[weekStart]) map[weekStart] = [];
      map[weekStart].push(task);
    });
    return Object.entries(map);
  }

  function handleAddTask() {
    if (!newTitle || !newDateTime) return;

    if (editingTask) {
      axios.put(`${API}/tasks/${editingTask._id}`, {
        title: newTitle,
        description: newDescription,
        datetime: newDateTime,
        priority: newPriority,
        status: editingTask.status
      }).then(res => {
        setTasks(tasks.map(t => t._id === editingTask._id ? res.data : t));
      });

    } else {
      axios.post(`${API}/tasks`, {
        title: newTitle,
        description: newDescription,
        datetime: newDateTime,
        priority: newPriority,
        status: "in-progress"
      }).then(res => {
        setTasks([...tasks, res.data]);
      });
    }

    setShowModal(false);
    setEditingTask(null);
    setNewTitle("");
    setNewDescription("");
    setNewDateTime("");
    setNewPriority("Medium");
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <header className="p-4 bg-white shadow sticky top-0 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-300"
        />
        <button
          onClick={() => setShowModal(true)}
          className="w-10 h-10 rounded-xl bg-indigo-600 text-white text-2xl flex items-center justify-center"
        >
          +
        </button>
      </header>

      <div className="p-4">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-gray-500">Organized by week</p>
      </div>

      <div className="p-4 space-y-4">
        {groupByWeek(
          tasks.filter(t =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase())
          )
        ).map(([weekKey, weekTasks]) => {
          const completed = weekTasks.filter(t => t.status === "completed").length;
          const total = weekTasks.length;
          const progress = Math.round((completed / total) * 100);
          const dateLabel = formatDateRange(weekTasks);
          const isOpen = openWeeks[weekKey] ?? false;

          return (
            <div key={weekKey} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setOpenWeeks(prev => ({ ...prev, [weekKey]: !isOpen }))}
              >
                <div>
                  <p className="text-xs text-gray-500">Week</p>
                  <p className="font-semibold">{dateLabel}</p>
                </div>
                <div className="flex gap-2 items-center text-xs">
                  <span className="px-2 py-1 rounded-xl bg-gray-100">{total - completed} Open</span>
                  <span className="px-2 py-1 rounded-xl bg-indigo-100 text-indigo-700">{completed} Completed</span>
                  <span className="text-lg">{isOpen ? "▾" : "▸"}</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="h-2 bg-indigo-600" style={{ width: `${progress}%` }}></div>
              </div>

              {isOpen && (
                <div className="space-y-2">
                  {weekTasks.map(task => (
                    <div key={task._id} className="border rounded-xl p-3 flex justify-between items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-500">{task.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(task.datetime).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          axios.put(`${API}/tasks/${task._id}`, {
                            ...task,
                            status: task.status === "completed" ? "in-progress" : "completed"
                          }).then(res => {
                            setTasks(tasks.map(t => t._id === task._id ? res.data : t));
                          })
                        }
                        className={`px-3 py-1 rounded-xl text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {task.status === "completed" ? "Completed" : "In Progress"}
                      </button>

                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setNewTitle(task.title);
                          setNewDescription(task.description);
                          setNewDateTime(task.datetime);
                          setNewPriority(task.priority);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 rounded-xl bg-blue-100 text-blue-600 text-xs font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          axios.delete(`${API}/tasks/${task._id}`).then(() => {
                            setTasks(tasks.filter(t => t._id !== task._id));
                          })
                        }
                        className="px-3 py-1 rounded-xl bg-red-100 text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center px-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl space-y-4 shadow-lg">
            <h2 className="text-xl font-semibold">{editingTask ? "Edit Task" : "Add Task"}</h2>

            <input className="w-full px-3 py-2 rounded-xl border" placeholder="Title"
              value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />

            <textarea className="w-full px-3 py-2 rounded-xl border" placeholder="Description"
              value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />

            <input type="datetime-local" className="w-full px-3 py-2 rounded-xl border"
              value={newDateTime} onChange={(e) => setNewDateTime(e.target.value)} />

            <select className="w-full px-3 py-2 rounded-xl border"
              value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border" onClick={() => { setShowModal(false); setEditingTask(null); }}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white" onClick={handleAddTask}>
                {editingTask ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
