import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const [error, setError] = useState("");

  // =========================
  // GET ALL TASKS
  // =========================
  const fetchTasks = async () => {
    try {
      setError("");

      const response = await fetch("/api/tasks");

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();

      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Could not load tasks.");
    }
  };

  // =========================
  // LOAD TASKS WHEN PAGE OPENS
  // =========================
  useEffect(() => {
    fetchTasks();
  }, []);

  // =========================
  // CREATE TASK
  // =========================
  const createTask = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      setError("");

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          description: description,
          completed: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setTitle("");
      setDescription("");

      await fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Could not create task.");
    }
  };

  // =========================
  // DELETE TASK
  // =========================
  const deleteTask = async (id) => {
    try {
      setError("");

      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Could not delete task.");
    }
  };

  // =========================
  // START EDITING
  // =========================
  const startEditing = (task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description);
  };

  // =========================
  // CANCEL EDITING
  // =========================
  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
  };

  // =========================
  // UPDATE TASK
  // =========================
  const updateTask = async (id) => {
    try {
      setError("");

      const task = tasks.find((task) => task.id === id);

      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          title: editingTitle,
          description: editingDescription,
          completed: task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      cancelEditing();

      await fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Could not update task.");
    }
  };

  // =========================
  // TOGGLE COMPLETED
  // =========================
  const toggleCompleted = async (task) => {
    try {
      setError("");

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          description: task.description,
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Could not update task.");
    }
  };

  return (
    <div className="app">
      <div className="container">

        {/* HEADER */}
        <header className="header">
          <h1>Task Manager</h1>
          <p>Manage your tasks with Spring Boot, React, MySQL & Docker</p>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* CREATE TASK FORM */}
        <section className="create-section">
          <h2>Create a New Task</h2>

          <form onSubmit={createTask}>

            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <textarea
              placeholder="Task description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
            />

            <button type="submit">
              Add Task
            </button>

          </form>
        </section>

        {/* TASK LIST */}
        <section className="tasks-section">

          <div className="section-header">
            <h2>Your Tasks</h2>

            <span className="task-count">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty">
              <p>No tasks yet.</p>
              <span>Create your first task above.</span>
            </div>
          ) : (
            <div className="task-list">

              {tasks.map((task) => (

                <div
                  className={`task-card ${
                    task.completed ? "completed" : ""
                  }`}
                  key={task.id}
                >

                  {editingId === task.id ? (

                    /* EDIT MODE */
                    <div className="edit-form">

                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                      />

                      <textarea
                        value={editingDescription}
                        onChange={(event) =>
                          setEditingDescription(event.target.value)
                        }
                      />

                      <div className="button-group">

                        <button
                          className="save-button"
                          onClick={() => updateTask(task.id)}
                        >
                          Save
                        </button>

                        <button
                          className="cancel-button"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>

                      </div>

                    </div>

                  ) : (

                    /* NORMAL MODE */
                    <>
                      <div className="task-content">

                        <div className="task-title-row">

                          <h3>{task.title}</h3>

                          <span
                            className={`status ${
                              task.completed
                                ? "status-completed"
                                : "status-pending"
                            }`}
                          >
                            {task.completed
                              ? "Completed"
                              : "Pending"}
                          </span>

                        </div>

                        <p>{task.description}</p>

                      </div>

                      <div className="button-group">

                        <button
                          className="complete-button"
                          onClick={() =>
                            toggleCompleted(task)
                          }
                        >
                          {task.completed
                            ? "Mark Pending"
                            : "Complete"}
                        </button>

                        <button
                          className="edit-button"
                          onClick={() =>
                            startEditing(task)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteTask(task.id)
                          }
                        >
                          Delete
                        </button>

                      </div>
                    </>
                  )}

                </div>

              ))}

            </div>
          )}

        </section>

      </div>
    </div>
  );
}

export default App;