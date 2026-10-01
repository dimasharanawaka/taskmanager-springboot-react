package com.dimasha.taskmanager;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskResponse(
        Long id,
        String title,
        String description,
        TaskPriority priority,
        TaskStatus status,
        LocalDate dueDate,
        boolean completed
) {

    public static TaskResponse from(Task task) {
        TaskStatus status = task.getStatus();
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                status,
                task.getDueDate(),
                status == TaskStatus.COMPLETED
        );
    }
}
