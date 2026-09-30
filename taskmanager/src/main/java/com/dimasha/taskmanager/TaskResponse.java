package com.dimasha.taskmanager;

public record TaskResponse(Long id, String title, String description, boolean completed) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getTitle(), task.getDescription(), task.isCompleted());
    }
}
