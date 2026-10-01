package com.dimasha.taskmanager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskRequest(
        @NotBlank(message = "Please enter a task title.")
        @Size(max = 255, message = "Title must be 255 characters or fewer.")
        String title,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.")
        String description,
        TaskPriority priority,
        TaskStatus status,
        LocalDate dueDate,
        Boolean completed
) {
    public TaskPriority priorityOrDefault() {
        return priority == null ? TaskPriority.MEDIUM : priority;
    }

    public TaskStatus statusOrDefault() {
        if (status != null) {
            return status;
        }
        return Boolean.TRUE.equals(completed) ? TaskStatus.COMPLETED : TaskStatus.TODO;
    }
}
