import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import {
  LayoutDashboard, CheckSquare, Wallet, CalendarDays, FileText, Bot,
  Plus, Send, Trash2, CheckCircle2, TrendingUp, Clock, Sparkles,
  Menu, X, Upload, RefreshCw, AlertCircle, CircleDollarSign,
  Mic, MicOff, Moon, Sun, Search, Filter, ArrowUpRight,
  Download, Scan, ShieldCheck, Flame, PieChart as PieIcon,
  Check, Calendar, ArrowRight, Zap, Target
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const CATEGORY_COLORS = {
  Food: "#f97316",
  Travel: "#0ea5e9",
  Education: "#8b5cf6",
  Bills: "#f43f5e",
  Shopping: "#ec4899",
  Health: "#10b981",
  Tech: "#3b82f6",
  Other: "#64748b"
};
const DEFAULT_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#ec4899", "#64748b"];

// Stable Container Component defined outside App to prevent unmounts & input focus loss
function Panel({ title, children, action, badge, className = "" }) {
  return (
    <section className={`rounded-2xl border p-5 shadow-sm transition-all bg-white dark:bg-[#111827] border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">{title}</h3>
          {badge && <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.tint}`}>{badge.label}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("lifesync_theme") || "light");
  const [page, setPage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [stats, setStats] = useState({});
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [insights, setInsights] = useState(null);
  const [healthInfo, setHealthInfo] = useState({ mode: "checking", status: "ok" });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskFilter, setTaskFilter] = useState("All");
  const [taskSearch, setTaskSearch] = useState("");

  // Expense form state
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseFilterCat, setExpenseFilterCat] = useState("All");
  const [budget, setBudget] = useState("8000");

  // Reminder form state
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  // AI chat state
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "assistant",
      text: "👋 Welcome to LifeSync AI! I can help streamline your daily tasks, log expenses, schedule reminders, and answer queries. Try speaking or tapping any quick action below!"
    }
  ]);
  const [proposal, setProposal] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const chatBottomRef = useRef(null);
  const taskInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Document state
  const [file, setFile] = useState(null);
  const [docCategory, setDocCategory] = useState("Personal");
  const [analyzingDocId, setAnalyzingDocId] = useState(null);

  // Sync theme
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("lifesync_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all data
  async function loadAll() {
    try {
      const [hRes, sRes, tRes, eRes, rRes, dRes, iRes] = await Promise.all([
        axios.get(`${API}/health`).catch(() => ({ data: { status: "offline", mode: "offline" } })),
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/expenses`),
        axios.get(`${API}/reminders`),
        axios.get(`${API}/documents`),
        axios.get(`${API}/insights`)
      ]);
      setHealthInfo(hRes.data);
      setStats(sRes.data);
      setTasks(tRes.data);
      setExpenses(eRes.data);
      setReminders(rRes.data);
      setDocuments(dRes.data);
      setInsights(iRes.data);
      setBudget(String(sRes.data.budget ?? 8000));
    } catch {
      showToast("Cannot connect to backend. Verify server is running on port 5000.", "error");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollTop = chatBottomRef.current.scrollHeight;
    }
  }, [chat, proposal]);

  async function runAction(action, successMessage) {
    setBusy(true);
    try {
      await action();
      await loadAll();
      if (successMessage) showToast(successMessage, "success");
    } catch (e) {
      showToast(e.response?.data?.error || "Action failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  // Seed demo data
  async function seedDemoData() {
    await runAction(
      () => axios.post(`${API}/seed`),
      "✨ Demo data loaded successfully!"
    );
  }

  // Reset demo data
  async function resetWorkspace() {
    if (window.confirm("Are you sure you want to clear your demo workspace?")) {
      await runAction(
        () => axios.post(`${API}/reset`),
        "Workspace reset to empty state."
      );
    }
  }

  // Tasks actions
  async function addTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await runAction(async () => {
      await axios.post(`${API}/tasks`, {
        title: taskTitle.trim(),
        deadline: taskDate || null,
        priority: taskPriority
      });
      setTaskTitle("");
      setTaskDate("");
      setTaskPriority("Medium");
    }, "Task added!");
    // Keep cursor inside input box so user can immediately type the next task
    setTimeout(() => {
      taskInputRef.current?.focus();
    }, 50);
  }

  async function toggleTask(task) {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    await runAction(
      () => axios.patch(`${API}/tasks/${task._id}`, { status: newStatus }),
      newStatus === "Completed" ? "Task marked completed! 🎉" : "Task marked pending."
    );
  }

  async function deleteTask(id) {
    await runAction(() => axios.delete(`${API}/tasks/${id}`), "Task deleted.");
  }

  // Expense actions
  async function addExpense(e) {
    e.preventDefault();
    const val = Number(expenseAmount);
    if (!val || val <= 0) return;
    await runAction(async () => {
      await axios.post(`${API}/expenses`, {
        amount: val,
        category: expenseCategory,
        description: expenseDescription || `${expenseCategory} expense`
      });
      setExpenseAmount("");
      setExpenseDescription("");
    }, "Expense recorded!");
  }

  async function quickExpense(amount, category, description) {
    await runAction(async () => {
      await axios.post(`${API}/expenses`, { amount, category, description });
    }, `Added ${description} (₹${amount})!`);
  }

  async function deleteExpense(id) {
    await runAction(() => axios.delete(`${API}/expenses/${id}`), "Expense removed.");
  }

  async function saveBudget(e) {
    e.preventDefault();
    const limit = Number(budget);
    if (!limit || limit <= 0) return;
    await runAction(
      () => axios.post(`${API}/budget`, { monthly_limit: limit }),
      "Monthly budget limit updated!"
    );
  }

  // Reminder actions
  async function addReminder(e) {
    e.preventDefault();
    if (!reminderTitle.trim()) return;
    await runAction(async () => {
      await axios.post(`${API}/reminders`, {
        title: reminderTitle.trim(),
        reminder_date: reminderDate || new Date().toISOString().split("T")[0]
      });
      setReminderTitle("");
      setReminderDate("");
    }, "Reminder scheduled!");
  }

  async function deleteReminder(id) {
    await runAction(() => axios.delete(`${API}/reminders/${id}`), "Reminder deleted.");
  }

  // AI chat actions
  async function sendChat(e, overrideText) {
    if (e) e.preventDefault();
    const text = (overrideText || message).trim();
    if (!text || busy) return;

    setChat(old => [...old, { role: "user", text }]);
    setMessage("");
    setProposal(null);
    setBusy(true);

    try {
      const { data } = await axios.post(`${API}/assistant/chat`, { message: text });
      setChat(old => [...old, {
        role: "assistant",
        text: data.proposal.response || "I processed your request."
      }]);
      if (data.requires_confirmation) {
        setProposal(data.proposal);
      }
    } catch (err) {
      setChat(old => [...old, {
        role: "assistant",
        text: err.response?.data?.error || "I ran into an issue processing that. Please try again."
      }]);
    } finally {
      setBusy(false);
    }
  }

  async function confirmProposal() {
    if (!proposal) return;
    await runAction(async () => {
      const { data } = await axios.post(`${API}/assistant/execute`, proposal);
      setChat(old => [...old, { role: "assistant", text: `✅ ${data.message}` }]);
      setProposal(null);
    }, "Action executed successfully!");
  }

  // Web Speech API Voice Recognition
  function toggleSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech recognition is not supported in this browser. Please use Chrome/Edge.", "error");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast("🎙️ Listening... speak your command now!", "info");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
        sendChat(null, transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        showToast("Microphone input stopped or permission denied.", "error");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  // Document upload & AI scan
  async function uploadDocument(e) {
    e.preventDefault();
    if (!file) return;
    await runAction(async () => {
      const form = new FormData();
      form.append("file", file);
      form.append("category", docCategory);
      await axios.post(`${API}/documents`, form);
      setFile(null);
      e.target.reset();
    }, "Document uploaded successfully!");
  }

  async function analyzeDoc(doc) {
    setAnalyzingDocId(doc._id);
    try {
      const { data } = await axios.post(`${API}/documents/analyze/${doc._id}`);
      const ext = data.extracted;
      if (ext && ext.suggested_action === "add_expense") {
        setProposal({
          action: "add_expense",
          title: ext.description,
          amount: ext.amount,
          category: ext.category,
          deadline: new Date().toISOString().split("T")[0]
        });
        setPage("AI Assistant");
        setChat(old => [...old, {
          role: "assistant",
          text: `📄 AI Document Scanner detected an invoice/receipt from "${doc.filename}". Extracted amount: ₹${ext.amount} under ${ext.category}. Would you like to log this expense?`
        }]);
        showToast("AI extracted expense data! Review and confirm in AI Assistant.", "info");
      }
    } catch {
      showToast("Failed to analyze document.", "error");
    } finally {
      setAnalyzingDocId(null);
    }
  }

  async function deleteDocument(id) {
    await runAction(() => axios.delete(`${API}/documents/${id}`), "Document removed.");
  }

  async function downloadDocument(id, name) {
    try {
      const response = await axios.get(`${API}/documents/${id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Unable to download document.", "error");
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      showToast("Browser notifications are not supported.", "error");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("LifeSync AI Active", {
        body: "Reminders & task alerts are now synchronized."
      });
      showToast("Notifications enabled!", "success");
    }
  }

  // Export summary
  function exportSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      stats,
      tasks,
      expenses,
      reminders
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifesync-summary-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Summary export downloaded!", "success");
  }

  // Category chart data
  const chartData = useMemo(() => {
    return Object.entries(insights?.by_category || {}).map(([name, value]) => ({
      name,
      value: Number(value)
    }));
  }, [insights]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
      if (!matchSearch) return false;
      if (taskFilter === "All") return true;
      if (taskFilter === "Pending") return t.status === "Pending";
      if (taskFilter === "Completed") return t.status === "Completed";
      if (taskFilter === "High") return t.priority === "High";
      if (taskFilter === "Due Soon") {
        if (!t.deadline || t.status === "Completed") return false;
        const diff = (new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 3;
      }
      return true;
    });
  }, [tasks, taskFilter, taskSearch]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (expenseFilterCat === "All") return true;
      return e.category === expenseFilterCat;
    });
  }, [expenses, expenseFilterCat]);

  // Budget calculations
  const totalSpent = Number(stats.total_expenses || 0);
  const budgetLimit = Math.max(1, Number(stats.budget || 8000));
  const budgetPercent = Math.min(100, Math.round((totalSpent / budgetLimit) * 100));
  const isBudgetWarning = budgetPercent >= 80;
  const isBudgetExceeded = totalSpent > budgetLimit;

  // Helper date formatter
  const formatDue = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date().toISOString().split("T")[0];
    const target = new Date(dateStr).toISOString().split("T")[0];
    if (target === today) return { label: "Today", urgent: true };
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (target === tomorrow) return { label: "Tomorrow", urgent: false };
    if (target < today) return { label: "Overdue", overdue: true };
    return { label: dateStr, urgent: false };
  };

  const navItems = [
    ["Dashboard", LayoutDashboard],
    ["Tasks", CheckSquare],
    ["Finance", Wallet],
    ["Calendar", CalendarDays],
    ["Documents", FileText],
    ["AI Assistant", Bot]
  ];

  const isDark = theme === "dark";

  // ------------------ DASHBOARD PAGE ------------------
  function renderDashboard() {
    return (
      <div className="space-y-6">
        {/* Top Pitch & Hero banner */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                <Sparkles size={13} /> Synchronized Copilot
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Flame size={13} /> {stats.streak_days || 5} Day Streak
              </span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day!
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Here is your centralized productivity & finance pulse.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={seedDemoData}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-violet-700 hover:to-indigo-700 transition"
              title="Loads realistic tasks, expenses, reminders and budget"
            >
              <Sparkles size={16} /> Load Demo Data
            </button>
            <button
              onClick={loadAll}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* 4 Primary Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks Pending</span>
              <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400"><Clock size={20} /></span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{stats.pending_tasks ?? 0}</p>
            <p className="mt-1 text-xs text-slate-400">of {stats.total_tasks ?? 0} total tasks logged</p>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Spent</span>
              <span className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400"><CircleDollarSign size={20} /></span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{money(stats.total_expenses)}</p>
            <p className="mt-1 text-xs text-slate-400">{budgetPercent}% of monthly limit</p>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Budget Available</span>
              <span className={`rounded-xl p-2.5 ${isBudgetExceeded ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}><Wallet size={20} /></span>
            </div>
            <p className={`mt-3 text-3xl font-bold tracking-tight ${isBudgetExceeded ? "text-rose-600" : ""}`}>{money(stats.remaining_budget)}</p>
            <p className="mt-1 text-xs text-slate-400">Monthly limit: {money(stats.budget)}</p>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Completion Rate</span>
              <span className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600 dark:text-violet-400"><Target size={20} /></span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{stats.productivity_score ?? 100}%</p>
            <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${stats.productivity_score ?? 100}%` }} />
            </div>
          </div>
        </div>

        {/* AI Insight banner */}
        {insights?.advice && (
          <div className={`flex items-center gap-3 rounded-2xl border p-4 ${isDark ? "bg-violet-950/30 border-violet-800/50 text-violet-200" : "bg-violet-50/80 border-violet-100 text-violet-900"}`}>
            <div className="rounded-xl bg-violet-600 p-2 text-white shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="text-sm leading-relaxed">
              <span className="font-bold">LifeSync AI Insight: </span>
              {insights.advice}
            </div>
          </div>
        )}

        {/* Middle row: Priority Focus & Spending Visuals */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Priority Focus Tasks */}
          <Panel
            title="High Priority Focus"
            action={<button onClick={() => setPage("Tasks")} className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">Manage all ({tasks.length}) &rarr;</button>}
          >
            {tasks.filter(t => t.status === "Pending").slice(0, 5).length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.filter(t => t.status === "Pending").slice(0, 5).map(t => (
                  <div key={t._id} className="flex items-center gap-3 py-3">
                    <button
                      onClick={() => toggleTask(t)}
                      className="text-slate-300 hover:text-emerald-500 transition shrink-0"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.priority === "High" ? "bg-rose-500/10 text-rose-600" : t.priority === "Medium" ? "bg-amber-500/10 text-amber-600" : "bg-slate-500/10 text-slate-500"}`}>
                          {t.priority}
                        </span>
                        {t.deadline && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {t.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Check className="mx-auto text-emerald-500 mb-2" size={32} />
                <p className="text-sm font-medium">All tasks completed!</p>
                <p className="text-xs text-slate-400 mt-1">Enjoy your day or create a new goal.</p>
              </div>
            )}
          </Panel>

          {/* Quick Voice / AI Shortcut */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Bot size={22} />
                </div>
                <button
                  onClick={toggleSpeech}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition ${isListening ? "bg-rose-500 text-white listening-pulse" : "bg-white/20 hover:bg-white/30 text-white"}`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  {isListening ? "Listening..." : "Voice Input"}
                </button>
              </div>
              <h3 className="mt-4 text-xl font-bold">Ask LifeSync Copilot</h3>
              <p className="mt-1 text-xs text-violet-100 leading-relaxed">
                Add tasks, log lunch expenses, or check your schedule with natural language.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setPage("AI Assistant")}
                  className="flex-1 rounded-xl bg-white py-2 text-center text-xs font-bold text-violet-700 hover:bg-violet-50 transition shadow"
                >
                  Open AI Assistant
                </button>
              </div>
            </div>

            {/* Upcoming Reminders */}
            <Panel
              title="Upcoming Reminders"
              action={<button onClick={() => setPage("Calendar")} className="text-xs font-semibold text-violet-600 dark:text-violet-400">View calendar</button>}
            >
              {reminders.length ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reminders.slice(0, 3).map(r => (
                    <div key={r._id} className="flex items-center gap-3 py-2.5">
                      <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                        <Clock size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-slate-400">{r.reminder_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No reminders active right now.</p>
              )}
            </Panel>
          </div>
        </div>

        {/* Spending distribution preview */}
        {chartData.length > 0 && (
          <Panel title="Expense Category Distribution">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => money(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Monthly Budget Usage</span>
                  <span className="font-bold">{budgetPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isBudgetExceeded ? "bg-rose-500" : isBudgetWarning ? "bg-amber-500" : "bg-violet-600"}`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {chartData.slice(0, 4).map(item => (
                    <div key={item.name} className={`p-2.5 rounded-xl border text-xs ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50"}`}>
                      <span className="text-slate-400 block">{item.name}</span>
                      <span className="font-bold text-sm">{money(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        )}
      </div>
    );
  }

  // ------------------ TASKS PAGE ------------------
  function renderTasks() {
    return (
      <div className="space-y-6">
        {/* Task Creation Form */}
        <Panel title="Add New Task">
          <form onSubmit={addTask} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_140px_auto]">
              <input
                ref={taskInputRef}
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="What task would you like to accomplish?"
                className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              />
              <input
                type="date"
                value={taskDate}
                onChange={e => setTaskDate(e.target.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              />
              <select
                value={taskPriority}
                onChange={e => setTaskPriority(e.target.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              >
                <option value="High">🔥 High</option>
                <option value="Medium">⚡ Medium</option>
                <option value="Low">🌱 Low</option>
              </select>
              <button
                type="submit"
                disabled={busy || !taskTitle.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50 shadow"
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
            {/* Quick date shortcuts */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Quick dates:</span>
              <button
                type="button"
                onClick={() => setTaskDate(new Date().toISOString().split("T")[0])}
                className="rounded-lg border px-2 py-1 hover:border-violet-500"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setTaskDate(d.toISOString().split("T")[0]);
                }}
                className="rounded-lg border px-2 py-1 hover:border-violet-500"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  setTaskDate(d.toISOString().split("T")[0]);
                }}
                className="rounded-lg border px-2 py-1 hover:border-violet-500"
              >
                Next Week
              </button>
            </div>
          </form>
        </Panel>

        {/* Task Management & Filters */}
        <Panel
          title={`All Tasks (${filteredTasks.length})`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={e => setTaskSearch(e.target.value)}
                  className={`rounded-lg border pl-8 pr-3 py-1.5 text-xs outline-none focus:border-violet-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                />
              </div>
            </div>
          }
        >
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            {["All", "Pending", "Completed", "High", "Due Soon"].map(f => (
              <button
                key={f}
                onClick={() => setTaskFilter(f)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition ${taskFilter === f ? "bg-violet-600 text-white shadow-sm" : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredTasks.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map(t => {
                const dueInfo = formatDue(t.deadline);
                const isDone = t.status === "Completed";
                return (
                  <div key={t._id} className="flex items-center gap-3 py-3 group">
                    <button
                      onClick={() => toggleTask(t)}
                      className={`transition shrink-0 ${isDone ? "text-emerald-500" : "text-slate-300 hover:text-emerald-500"}`}
                      title={isDone ? "Mark as pending" : "Mark as completed"}
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium transition ${isDone ? "line-through text-slate-400" : ""}`}>
                        {t.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.priority === "High" ? "bg-rose-500/10 text-rose-600" : t.priority === "Medium" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"}`}>
                          {t.priority}
                        </span>
                        {dueInfo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${dueInfo.overdue ? "bg-rose-500/20 text-rose-600 font-semibold" : dueInfo.urgent ? "bg-amber-500/20 text-amber-600 font-semibold" : "text-slate-400"}`}>
                            <Calendar size={11} /> {dueInfo.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(t._id)}
                      className="text-slate-300 hover:text-rose-500 transition p-1 opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <CheckSquare size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks matching this filter.</p>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  // ------------------ FINANCE & BUDGET PAGE ------------------
  function renderFinance() {
    return (
      <div className="space-y-6">
        {/* Top 3 Finance Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
            <span className="text-sm font-medium text-slate-500">Monthly Spending Limit</span>
            <p className="mt-2 text-2xl font-bold">{money(stats.budget)}</p>
            <p className="text-xs text-slate-400 mt-1">Configured for {stats.month || "this month"}</p>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
            <span className="text-sm font-medium text-slate-500">Total Spent</span>
            <p className="mt-2 text-2xl font-bold text-rose-500">{money(stats.total_expenses)}</p>
            <p className="text-xs text-slate-400 mt-1">{budgetPercent}% of limit consumed</p>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
            <span className="text-sm font-medium text-slate-500">Remaining Budget</span>
            <p className={`mt-2 text-2xl font-bold ${isBudgetExceeded ? "text-rose-500" : "text-emerald-500"}`}>{money(stats.remaining_budget)}</p>
            <p className="text-xs text-slate-400 mt-1">{isBudgetExceeded ? "Exceeded limit!" : "Safe and balanced"}</p>
          </div>
        </div>

        {/* Set Budget & Progress Meter */}
        <Panel title="Budget Tracker & Progress">
          <div className="space-y-4">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isBudgetExceeded ? "bg-rose-500" : isBudgetWarning ? "bg-amber-500" : "bg-violet-600"}`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>₹0</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">{budgetPercent}% utilized</span>
              <span>{money(stats.budget)}</span>
            </div>

            <form onSubmit={saveBudget} className="flex flex-wrap gap-3 pt-2">
              <input
                type="number"
                min="100"
                step="50"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="Set new monthly budget"
                className={`rounded-xl border px-4 py-2 text-sm flex-1 min-w-[200px] outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 dark:bg-slate-700 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Save Budget
              </button>
            </form>
          </div>
        </Panel>

        {/* Add Expense Section */}
        <Panel title="Record an Expense">
          <form onSubmit={addExpense} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                placeholder="Amount (₹)"
                className={`rounded-xl border px-4 py-2.5 text-sm outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              />
              <select
                value={expenseCategory}
                onChange={e => setExpenseCategory(e.target.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              >
                <option value="Food">🍔 Food & Dining</option>
                <option value="Travel">🚕 Travel & Cab</option>
                <option value="Tech">💻 Tech & Cloud</option>
                <option value="Education">📚 Education & Courses</option>
                <option value="Bills">⚡ Utilities & Bills</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Health">💊 Health & Fitness</option>
                <option value="Other">🏷️ Other</option>
              </select>
              <input
                value={expenseDescription}
                onChange={e => setExpenseDescription(e.target.value)}
                placeholder="Description (e.g. Team Lunch with Client)"
                className={`rounded-xl border px-4 py-2.5 text-sm outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              />
              <button
                type="submit"
                disabled={busy || !expenseAmount}
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50"
              >
                Add Expense
              </button>
            </div>

            {/* Quick 1-tap expense presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-slate-400">Quick log:</span>
              <button
                type="button"
                onClick={() => quickExpense(80, "Food", "Coffee & Tea")}
                className="rounded-full border px-3 py-1 hover:border-violet-500"
              >
                ☕ Coffee ₹80
              </button>
              <button
                type="button"
                onClick={() => quickExpense(250, "Food", "Lunch")}
                className="rounded-full border px-3 py-1 hover:border-violet-500"
              >
                🍕 Lunch ₹250
              </button>
              <button
                type="button"
                onClick={() => quickExpense(180, "Travel", "Cab Ride")}
                className="rounded-full border px-3 py-1 hover:border-violet-500"
              >
                🚕 Cab ₹180
              </button>
              <button
                type="button"
                onClick={() => quickExpense(499, "Bills", "Mobile Recharge")}
                className="rounded-full border px-3 py-1 hover:border-violet-500"
              >
                📱 Recharge ₹499
              </button>
            </div>
          </form>
        </Panel>

        {/* Expenses List & Category Chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Visual */}
          <Panel title="Spending by Category">
            {chartData.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius={85}
                    >
                      {chartData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => money(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-12 text-center">Log expenses to see breakdown.</p>
            )}
          </Panel>

          {/* Expense Log */}
          <Panel
            title={`Recent Expenses (${filteredExpenses.length})`}
            action={
              <select
                value={expenseFilterCat}
                onChange={e => setExpenseFilterCat(e.target.value)}
                className={`rounded-lg border px-2 py-1 text-xs ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
              >
                <option value="All">All Categories</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Tech">Tech</option>
                <option value="Bills">Bills</option>
                <option value="Shopping">Shopping</option>
                <option value="Education">Education</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            }
          >
            {filteredExpenses.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {filteredExpenses.map(x => (
                  <div key={x._id} className="flex items-center justify-between py-2.5 group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{x.description || x.category}</p>
                      <p className="text-xs text-slate-400">{x.category} · {x.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">{money(x.amount)}</span>
                      <button
                        onClick={() => deleteExpense(x._id)}
                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                        title="Delete expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No expenses recorded for this category.</p>
            )}
          </Panel>
        </div>
      </div>
    );
  }

  // ------------------ CALENDAR & REMINDERS PAGE ------------------
  function renderCalendar() {
    const combinedSchedule = [
      ...tasks.filter(t => t.deadline).map(t => ({
        id: t._id,
        title: t.title,
        date: t.deadline,
        type: "task",
        status: t.status,
        priority: t.priority
      })),
      ...reminders.map(r => ({
        id: r._id,
        title: r.title,
        date: r.reminder_date,
        type: "reminder",
        status: r.status || "Pending",
        priority: "Normal"
      }))
    ].sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="space-y-6">
        {/* Add Reminder Form */}
        <Panel title="Schedule a Reminder">
          <form onSubmit={addReminder} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto]">
            <input
              value={reminderTitle}
              onChange={e => setReminderTitle(e.target.value)}
              placeholder="What would you like to be reminded of?"
              className={`rounded-xl border px-4 py-2.5 text-sm outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
            />
            <input
              type="date"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              className={`rounded-xl border px-3 py-2.5 text-sm outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
            />
            <button
              type="submit"
              disabled={busy || !reminderTitle.trim()}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50"
            >
              Set Reminder
            </button>
          </form>
        </Panel>

        {/* Unified Timeline */}
        <Panel
          title="Timeline & Schedule"
          action={
            <button
              onClick={enableNotifications}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
            >
              🔔 Test Browser Notifications
            </button>
          }
        >
          {combinedSchedule.length ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {combinedSchedule.map(item => (
                <div key={item.id} className="relative flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <span className={`absolute -left-[29px] top-4.5 h-3 w-3 rounded-full border-2 ${item.type === "task" ? "bg-violet-600 border-white dark:border-slate-900" : "bg-amber-500 border-white dark:border-slate-900"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === "task" ? "bg-violet-500/10 text-violet-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {item.type === "task" ? "TASK DEADLINE" : "REMINDER"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                    </div>
                    <p className="text-sm font-semibold mt-1">{item.title}</p>
                  </div>
                  {item.type === "reminder" && (
                    <button
                      onClick={() => deleteReminder(item.id)}
                      className="text-slate-400 hover:text-rose-500 transition"
                      title="Delete reminder"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center">No scheduled deadlines or reminders.</p>
          )}
        </Panel>
      </div>
    );
  }

  // ------------------ DOCUMENTS & SMART OCR HUB ------------------
  function renderDocuments() {
    return (
      <div className="space-y-6">
        <Panel title="Upload & Analyze Document">
          <form onSubmit={uploadDocument} className="space-y-4">
            <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${isDark ? "border-slate-700 hover:border-violet-500 bg-slate-900/40" : "border-slate-200 hover:border-violet-500 bg-slate-50/50"}`}>
              <Upload size={32} className="mx-auto text-violet-600 mb-2" />
              <p className="text-sm font-medium">Click to select receipt, invoice, or PDF</p>
              <p className="text-xs text-slate-400 mt-1">Supports PDF, PNG, JPG up to 5 MB</p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="mt-3 block mx-auto text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Category:</span>
                <select
                  value={docCategory}
                  onChange={e => setDocCategory(e.target.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                >
                  <option value="Personal">Personal</option>
                  <option value="Finance">Finance / Receipt</option>
                  <option value="Education">Education</option>
                  <option value="Identity">Identity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!file || busy}
                className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50"
              >
                Upload File
              </button>
            </div>
          </form>
        </Panel>

        <Panel title={`Stored Documents (${documents.length})`}>
          {documents.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map(d => (
                <div key={d._id} className="flex items-center gap-3 py-3">
                  <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.filename}</p>
                    <p className="text-xs text-slate-400">
                      {d.category} · {d.size_kb ? `${d.size_kb} KB` : "Document"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => analyzeDoc(d)}
                      disabled={analyzingDocId === d._id}
                      className="flex items-center gap-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-3 py-1.5 text-xs font-medium transition"
                      title="Extract expense/invoice details with AI"
                    >
                      <Scan size={14} /> {analyzingDocId === d._id ? "Scanning..." : "AI Scan"}
                    </button>
                    <button
                      onClick={() => downloadDocument(d._id, d.filename)}
                      className="rounded-lg border px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                      title="Download file"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteDocument(d._id)}
                      className="text-slate-400 hover:text-rose-500 transition p-1"
                      title="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center">No documents uploaded yet.</p>
          )}
        </Panel>
      </div>
    );
  }

  // ------------------ AI ASSISTANT PAGE ------------------
  function renderAssistant() {
    return (
      <div className={`mx-auto max-w-3xl rounded-2xl border shadow-sm overflow-hidden flex flex-col h-[750px] ${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-100"}`}>
        {/* Assistant Header */}
        <div className="flex items-center justify-between border-b p-4 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-600 p-2 text-white">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">LifeSync AI Copilot</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready to organize
              </p>
            </div>
          </div>
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isListening ? "bg-rose-500 text-white listening-pulse" : isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            {isListening ? "Listening..." : "Tap to Speak"}
          </button>
        </div>

        {/* Chat Stream */}
        <div ref={chatBottomRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-violet-600 text-white" : isDark ? "bg-slate-800 text-slate-100 border border-slate-700" : "bg-slate-100 text-slate-800 border border-slate-200"}`}
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="animate-spin text-violet-500" /> LifeSync is processing your command…
            </div>
          )}

          {/* Interactive Proposal Card */}
          {proposal && (
            <div className="rounded-2xl border-2 border-violet-500/40 bg-violet-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  ⚡ AI Action Drafted
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold">
                  {proposal.action.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {proposal.title && (
                  <div>
                    <label className="text-slate-400 block mb-0.5">Title / Details:</label>
                    <input
                      value={proposal.title}
                      onChange={e => setProposal({ ...proposal, title: e.target.value })}
                      className={`w-full rounded-lg border p-2 text-xs outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                )}
                {proposal.amount != null && (
                  <div>
                    <label className="text-slate-400 block mb-0.5">Amount (₹):</label>
                    <input
                      type="number"
                      value={proposal.amount}
                      onChange={e => setProposal({ ...proposal, amount: Number(e.target.value) })}
                      className={`w-full rounded-lg border p-2 text-xs outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                )}
                {proposal.category && (
                  <div>
                    <label className="text-slate-400 block mb-0.5">Category:</label>
                    <input
                      value={proposal.category}
                      onChange={e => setProposal({ ...proposal, category: e.target.value })}
                      className={`w-full rounded-lg border p-2 text-xs outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                )}
                {proposal.deadline && (
                  <div>
                    <label className="text-slate-400 block mb-0.5">Date / Deadline:</label>
                    <input
                      type="date"
                      value={proposal.deadline}
                      onChange={e => setProposal({ ...proposal, deadline: e.target.value })}
                      className={`w-full rounded-lg border p-2 text-xs outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={confirmProposal}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-bold text-white hover:bg-violet-700 transition"
                >
                  Confirm & Execute Action
                </button>
                <button
                  onClick={() => setProposal(null)}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold ${isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <form onSubmit={sendChat} className="flex items-center gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Add high priority task: Present pitch deck tomorrow..."
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}`}
            />
            <button
              type="button"
              onClick={toggleSpeech}
              className={`p-2.5 rounded-xl border transition ${isListening ? "bg-rose-500 text-white border-rose-500 listening-pulse" : isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
              title="Speak command"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              type="submit"
              disabled={busy || !message.trim()}
              className="rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-700 transition disabled:opacity-50"
              title="Send command"
            >
              <Send size={18} />
            </button>
          </form>

          {/* Quick Prompts Chips */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              "Add high priority task: Deliver Project Pitch",
              "Spent 450 for team lunch",
              "Remind me to submit project link tomorrow",
              "How much budget is remaining?",
              "What should I focus on today?"
            ].map(q => (
              <button
                key={q}
                onClick={() => {
                  setMessage(q);
                  sendChat(null, q);
                }}
                className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] transition ${isDark ? "border-slate-800 text-slate-400 hover:border-violet-500 hover:text-white" : "border-slate-200 text-slate-500 hover:border-violet-500 hover:text-violet-700"}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const contentMap = {
    Dashboard: renderDashboard,
    Tasks: renderTasks,
    Finance: renderFinance,
    Calendar: renderCalendar,
    Documents: renderDocuments,
    "AI Assistant": renderAssistant
  };

  return (
    <div className={`min-h-screen md:flex transition-colors duration-200 ${isDark ? "bg-[#0b0f19] text-slate-100" : "bg-[#f8fafc] text-slate-900"}`}>
      {/* Mobile menu backdrop */}
      {mobileMenu && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r p-5 transition-transform md:static md:translate-x-0 ${isDark ? "bg-[#0e1424] border-slate-800" : "bg-white border-slate-100"} ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight">LifeSync</span>{" "}
              <span className="text-violet-600 font-extrabold text-sm uppercase px-1.5 py-0.5 rounded bg-violet-500/10">AI</span>
            </div>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenu(false)}>
            <X size={20} />
          </button>
        </div>

        <p className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Workspace</p>
        <nav className="space-y-1">
          {navItems.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => {
                setPage(name);
                setMobileMenu(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${page === name ? "bg-violet-600 text-white shadow-sm" : isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Icon size={17} />
              {name}
            </button>
          ))}
        </nav>

        {/* Demo helper banner in sidebar */}
        <div className={`mt-8 rounded-2xl border p-4 text-xs ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50"}`}>
          <div className="flex items-center gap-2 font-bold text-violet-600 dark:text-violet-400">
            <Zap size={15} /> Quick Setup
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
            One-click data seed to explore all features with sample data.
          </p>
          <button
            onClick={seedDemoData}
            className="mt-3 w-full rounded-xl bg-violet-600 py-1.5 text-center text-xs font-semibold text-white hover:bg-violet-700 transition"
          >
            Load Demo Data
          </button>
        </div>

        <div className="absolute bottom-5 left-5 right-5 text-xs text-slate-400">
          <p className="font-semibold text-slate-500 dark:text-slate-400">LifeSync AI Pro</p>
          <p className="text-[10px] mt-0.5">Mode: {stats.storage_mode || "Active"}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {/* Top App Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="rounded-lg border bg-white dark:bg-slate-800 p-2 md:hidden"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{page}</h1>
              <p className="text-xs text-slate-400">Synchronized Productivity Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Storage status badge */}
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              title="Storage active"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {stats.storage_mode || "Ready"}
            </span>

            {/* Export Summary */}
            <button
              onClick={exportSummary}
              className={`rounded-xl border p-2 text-xs font-medium transition ${isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
              title="Export workspace summary"
            >
              <Download size={16} />
            </button>

            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              className={`rounded-xl border p-2 text-xs font-medium transition ${isDark ? "border-slate-700 hover:bg-slate-800 text-amber-400" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}
              title="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Reset data */}
            <button
              onClick={resetWorkspace}
              className={`rounded-xl border p-2 text-xs font-medium transition text-rose-500 ${isDark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
              title="Reset workspace"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </header>

        {/* Global Floating Toast */}
        {toast && (
          <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl p-3 text-sm font-medium shadow-md transition-all ${toast.type === "error" ? "bg-rose-500 text-white" : toast.type === "info" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"}`}>
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Dynamic page content */}
        {(contentMap[page] || renderDashboard)()}

        <footer className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
          LifeSync AI — Empowering productivity & finance synchronization.
        </footer>
      </main>
    </div>
  );
}
