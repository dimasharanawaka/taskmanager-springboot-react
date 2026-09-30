import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { ApiError, authApi, clearToken, getToken, setToken, tasksApi } from "./api/api";

const emptyForm = { title: "", description: "" };

function App() {
  const [authStatus, setAuthStatus] = useState(() => (getToken() ? "loading" : "unauthenticated"));
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [formMode, setFormMode] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleAuthFailure = () => {
    clearToken();
    setUser(null);
    setTasks([]);
    setAuthStatus("unauthenticated");
  };

  const fetchTasks = async () => {
    try {
      setError("");
      setTasks(await tasksApi.list());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthFailure();
        return;
      }
      console.error("Error fetching tasks:", error);
      setError("Could not load your tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    const loadTasks = async () => {
      try {
        setTasks(await tasksApi.list());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          handleAuthFailure();
          return;
        }
        console.error("Error fetching tasks:", error);
        setError("Could not load your tasks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [authStatus]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    authApi.me()
      .then((authenticatedUser) => {
        setUser(authenticatedUser);
        setAuthStatus("authenticated");
      })
      .catch(() => handleAuthFailure());
  }, []);

  const handleAuthenticated = (authResponse) => {
    setToken(authResponse.token);
    setUser(authResponse.user);
    setAuthStatus("authenticated");
    setError("");
  };

  const handleLogout = () => {
    handleAuthFailure();
    setActiveView("dashboard");
  };

  const openCreateForm = () => {
    setFormMode({ type: "create" });
    setFormValues(emptyForm);
    setFormError("");
    setFeedback("");
  };

  const openEditForm = (task) => {
    setFormMode({ type: "edit", taskId: task.id });
    setFormValues({ title: task.title || "", description: task.description || "" });
    setFormError("");
    setFeedback("");
  };

  const closeForm = () => {
    setFormMode(null);
    setFormValues(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!formValues.title.trim()) {
      setFormError("Add a title before saving this task.");
      return;
    }

    try {
      setError("");
      setFormError("");
      setIsSaving(true);
      const isEditing = formMode.type === "edit";
      const existingTask = isEditing
        ? tasks.find((task) => task.id === formMode.taskId)
        : null;
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        completed: existingTask?.completed || false,
      };
      if (isEditing) {
        await tasksApi.update(formMode.taskId, payload);
      } else {
        await tasksApi.create(payload);
      }
      await fetchTasks();
      closeForm();
      setFeedback(isEditing ? "Task updated successfully." : "Task created successfully.");
    } catch (error) {
      console.error("Error saving task:", error);
      setFormError("Could not save this task. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCompleted = async (task) => {
    try {
      setError("");
      const updatedTask = await tasksApi.update(task.id, {
        title: task.title,
        description: task.description,
        completed: !task.completed,
      });
      setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthFailure();
        return;
      }
      console.error("Error updating task:", error);
      setError("Could not update task. Please try again.");
    }
  };

  const deleteTask = async () => {
    try {
      setError("");
      setIsDeleting(true);
      await tasksApi.remove(taskToDelete.id);
      setTasks((current) => current.filter((task) => task.id !== taskToDelete.id));
      setTaskToDelete(null);
      setFeedback("Task deleted successfully.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthFailure();
        return;
      }
      console.error("Error deleting task:", error);
      setError("Could not delete task. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((task) => task.completed).length,
    pending: tasks.filter((task) => !task.completed).length,
  }), [tasks]);

  const openTasks = () => setActiveView("tasks");

  if (authStatus === "loading") {
    return <AuthLoading />;
  }

  if (authStatus === "unauthenticated") {
    return <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>TF</span><strong>TaskFlow</strong></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeView === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("dashboard")}>
            <span className="nav-icon">⌂</span>Dashboard
          </button>
          <button className={activeView === "tasks" ? "nav-item active" : "nav-item"} onClick={openTasks}>
            <span className="nav-icon">✓</span>Tasks
          </button>
        </nav>
        <div className="sidebar-footer">Personal workspace</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><span>TF</span><strong>TaskFlow</strong></div>
          <div className="workspace-label">Personal workspace</div>
          <div className="user-menu"><div className="user-details"><strong>{user.name}</strong><span>{user.email}</span></div><button className="logout-button" onClick={handleLogout}>Log out</button></div>
        </header>

        <div className="page-content">
          {error && <div className="alert error" role="alert">{error}</div>}
          {feedback && <div className="alert success" role="status">{feedback}</div>}

          {activeView === "dashboard" ? (
            <Dashboard stats={stats} tasks={tasks} isLoading={isLoading} onViewTasks={openTasks} />
          ) : (
            <TasksView
              tasks={tasks}
              isLoading={isLoading}
              onAdd={openCreateForm}
              onEdit={openEditForm}
              onDelete={setTaskToDelete}
              onToggle={toggleCompleted}
            />
          )}
        </div>
      </main>

      {formMode && (
        <TaskForm
          mode={formMode.type}
          values={formValues}
          error={formError}
          isSaving={isSaving}
          onChange={handleFormChange}
          onSubmit={saveTask}
          onCancel={closeForm}
        />
      )}

      {taskToDelete && (
        <DeleteConfirmation
          task={taskToDelete}
          isDeleting={isDeleting}
          onCancel={() => setTaskToDelete(null)}
          onConfirm={deleteTask}
        />
      )}
    </div>
  );
}

function Dashboard({ stats, tasks, isLoading, onViewTasks }) {
  const recentTasks = tasks.slice(0, 4);

  return (
    <div className="view dashboard-view">
      <div className="page-heading">
        <div><p className="eyebrow">Overview</p><h1>Good evening <span aria-hidden="true">👋</span></h1><p className="page-description">Here&apos;s a clear view of what&apos;s on your plate.</p></div>
        <button className="button primary" onClick={onViewTasks}>View all tasks</button>
      </div>
      <div className="stat-grid">
        <StatCard label="Total tasks" value={stats.total} tone="primary" />
        <StatCard label="Completed" value={stats.completed} tone="success" />
        <StatCard label="Pending" value={stats.pending} tone="warning" />
      </div>
      <section className="overview-section">
        <div className="section-heading"><div><h2>Task overview</h2><p>Your latest work at a glance.</p></div><button className="text-button" onClick={onViewTasks}>Manage tasks <span aria-hidden="true">→</span></button></div>
        {isLoading ? <LoadingState /> : recentTasks.length === 0 ? <EmptyState /> : <div className="overview-list">{recentTasks.map((task) => <TaskRow key={task.id} task={task} />)}</div>}
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return <div className={`stat-card ${tone}`}><span className="stat-icon" aria-hidden="true">{tone === "success" ? "✓" : tone === "warning" ? "○" : "#"}</span><div><p>{label}</p><strong>{value}</strong></div></div>;
}

function TasksView({ tasks, isLoading, onAdd, onEdit, onDelete, onToggle }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === "all" || (filter === "completed" ? task.completed : !task.completed);
    const matchesSearch = !normalizedSearch || `${task.title} ${task.description}`.toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="view tasks-view">
      <div className="page-heading"><div><p className="eyebrow">Workspace</p><h1>Tasks</h1><p className="page-description">Capture, organize, and complete your work.</p></div><button className="button primary" onClick={onAdd}><span aria-hidden="true">+</span> Add task</button></div>
      <section className="task-panel">
        <div className="task-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><span className="sr-only">Search tasks</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." /></label><div className="filter-tabs" role="group" aria-label="Filter tasks">{[["all", "All"], ["pending", "Pending"], ["completed", "Completed"]].map(([value, label]) => <button key={value} className={filter === value ? "filter-tab active" : "filter-tab"} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
        {isLoading ? <LoadingState /> : tasks.length === 0 ? <EmptyState onAdd={onAdd} /> : filteredTasks.length === 0 ? <NoResultsState /> : <div className="task-list">{filteredTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />)}</div>}
      </section>
    </div>
  );
}

function TaskRow({ task }) {
  return <div className="task-row"><span className={`status-dot ${task.completed ? "complete" : "pending"}`} aria-hidden="true" /><div><strong className={task.completed ? "completed-text" : ""}>{task.title}</strong><p>{task.description || "No description"}</p></div><span className={`status-badge ${task.completed ? "completed" : "pending"}`}>{task.completed ? "Completed" : "Pending"}</span></div>;
}

function TaskCard({ task, onEdit, onDelete, onToggle }) {
  return <article className={`task-card ${task.completed ? "is-complete" : ""}`}><div className="task-card-main"><button className={`check-button ${task.completed ? "checked" : ""}`} onClick={() => onToggle(task)} aria-label={task.completed ? `Mark ${task.title} as pending` : `Mark ${task.title} as completed`}>{task.completed ? "✓" : ""}</button><div className="task-card-copy"><div className="task-title-line"><h2>{task.title}</h2><span className={`status-badge ${task.completed ? "completed" : "pending"}`}>{task.completed ? "Completed" : "Pending"}</span></div><p>{task.description || "No description"}</p></div></div><div className="task-actions"><button className="button secondary" onClick={() => onEdit(task)}>Edit</button><button className="button danger-ghost" onClick={() => onDelete(task)}>Delete</button></div></article>;
}

function TaskForm({ mode, values, error, isSaving, onChange, onSubmit, onCancel }) {
  return <div className="modal-backdrop"><section className="modal task-form-modal" role="dialog" aria-modal="true" aria-labelledby="task-form-title"><div className="modal-header"><div><p className="eyebrow">{mode === "edit" ? "Update task" : "New task"}</p><h2 id="task-form-title">{mode === "edit" ? "Edit task" : "Add a task"}</h2></div><button className="icon-button" onClick={onCancel} aria-label="Close form">×</button></div><form onSubmit={onSubmit}><div className="form-field"><label htmlFor="task-title">Title</label><input id="task-title" name="title" value={values.title} onChange={onChange} placeholder="What needs to be done?" autoFocus /></div><div className="form-field"><label htmlFor="task-description">Description <span>(optional)</span></label><textarea id="task-description" name="description" value={values.description} onChange={onChange} placeholder="Add a little context..." rows="5" /></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button primary" disabled={isSaving}>{isSaving ? "Saving..." : "Save task"}</button></div></form></section></div>;
}

function DeleteConfirmation({ task, isDeleting, onCancel, onConfirm }) {
  return <div className="modal-backdrop"><section className="modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="confirmation-icon" aria-hidden="true">!</div><h2 id="delete-title">Delete task?</h2><p>Are you sure you want to delete <strong>&quot;{task.title}&quot;</strong>? This action cannot be undone.</p><div className="modal-actions"><button className="button secondary" onClick={onCancel}>Cancel</button><button className="button danger" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete task"}</button></div></section></div>;
}

function LoadingState() { return <div className="state-panel"><div className="loader" aria-hidden="true" /><p>Loading your tasks...</p></div>; }
function EmptyState({ onAdd }) { return <div className="state-panel"><div className="state-icon" aria-hidden="true">✓</div><h2>No tasks yet</h2><p>Create your first task to get started.</p>{onAdd && <button className="button primary" onClick={onAdd}>Add your first task</button>}</div>; }
function NoResultsState() { return <div className="state-panel"><div className="state-icon" aria-hidden="true">⌕</div><h2>No tasks match your search</h2><p>Try a different search or filter.</p></div>; }

function AuthLoading() {
  return <div className="auth-loading"><div className="brand-mark"><span>TF</span><strong>TaskFlow</strong></div><div className="loader" aria-hidden="true" /><p>Restoring your session...</p></div>;
}

function AuthScreen({ mode, onModeChange, onAuthenticated }) {
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === "register";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (isRegistering && values.password !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = isRegistering
        ? await authApi.register({ name: values.name.trim(), email: values.email.trim(), password: values.password })
        : await authApi.login({ email: values.email.trim(), password: values.password });
      onAuthenticated(response);
    } catch (submissionError) {
      if (submissionError instanceof ApiError && submissionError.fields) {
        setError(Object.values(submissionError.fields)[0] || submissionError.message);
      } else {
        setError(submissionError.message || "Unable to continue. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><div className="brand-mark"><span>TF</span><strong>TaskFlow</strong></div><p>{isRegistering ? "Create your personal productivity space." : "A calmer way to manage your work."}</p></div><div className="auth-heading"><p className="eyebrow">{isRegistering ? "Get started" : "Welcome back"}</p><h1>{isRegistering ? "Create your account" : "Sign in to TaskFlow"}</h1><p>{isRegistering ? "Start organizing your tasks today." : "Continue where you left off."}</p></div><form className="auth-form" onSubmit={submit}>{isRegistering && <div className="form-field"><label htmlFor="auth-name">Name</label><input id="auth-name" name="name" value={values.name} onChange={handleChange} placeholder="Your name" autoComplete="name" required /></div>}<div className="form-field"><label htmlFor="auth-email">Email</label><input id="auth-email" name="email" type="email" value={values.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required /></div><div className="form-field"><label htmlFor="auth-password">Password</label><input id="auth-password" name="password" type="password" value={values.password} onChange={handleChange} placeholder="At least 8 characters" autoComplete={isRegistering ? "new-password" : "current-password"} minLength="8" required /></div>{isRegistering && <div className="form-field"><label htmlFor="auth-confirm-password">Confirm password</label><input id="auth-confirm-password" name="confirmPassword" type="password" value={values.confirmPassword} onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" required /></div>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : isRegistering ? "Create account" : "Sign in"}</button></form><p className="auth-switch">{isRegistering ? "Already have an account?" : "New to TaskFlow?"} <button onClick={() => { setError(""); onModeChange(isRegistering ? "login" : "register"); }}>{isRegistering ? "Sign in" : "Create an account"}</button></p></section></main>;
}

export default App;