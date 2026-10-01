package com.dimasha.taskmanager;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.TODO;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean completed;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Task() {
    }

    public Task(String title, String description, boolean completed) {
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.priority = TaskPriority.MEDIUM;
        this.status = completed ? TaskStatus.COMPLETED : TaskStatus.TODO;
    }

    @PrePersist
    @PreUpdate
    private void syncCompletionStatus() {
        if (priority == null) {
            priority = TaskPriority.MEDIUM;
        }
        if (status == null) {
            status = completed ? TaskStatus.COMPLETED : TaskStatus.TODO;
        }
        completed = status == TaskStatus.COMPLETED;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TaskPriority getPriority() {
        return priority == null ? TaskPriority.MEDIUM : priority;
    }

    public void setPriority(TaskPriority priority) {
        this.priority = priority == null ? TaskPriority.MEDIUM : priority;
    }

    public TaskStatus getStatus() {
        if (status != null) {
            return status;
        }
        return completed ? TaskStatus.COMPLETED : TaskStatus.TODO;
    }

    public void setStatus(TaskStatus status) {
        this.status = status == null ? (completed ? TaskStatus.COMPLETED : TaskStatus.TODO) : status;
        this.completed = this.status == TaskStatus.COMPLETED;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public boolean isCompleted() {
        return getStatus() == TaskStatus.COMPLETED;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
        if (completed) {
            this.status = TaskStatus.COMPLETED;
            return;
        }
        if (this.status == null || this.status == TaskStatus.COMPLETED) {
            this.status = TaskStatus.TODO;
        }
    }

    @JsonIgnore
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}