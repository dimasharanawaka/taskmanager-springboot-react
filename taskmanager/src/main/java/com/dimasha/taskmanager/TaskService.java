package com.dimasha.taskmanager;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskResponse> getTasks(UserPrincipal principal) {
        return taskRepository.findAllByUserId(principal.getUser().getId()).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse createTask(TaskRequest request, UserPrincipal principal) {
        Task task = new Task();
        task.setTitle(request.title().trim());
        task.setDescription(normalizeDescription(request.description()));
        task.setPriority(request.priorityOrDefault());
        task.setStatus(request.statusOrDefault());
        task.setDueDate(request.dueDate());
        task.setUser(principal.getUser());
        return TaskResponse.from(taskRepository.save(task));
    }

    public TaskResponse updateTask(Long id, TaskRequest request, UserPrincipal principal) {
        Task task = findOwnedTask(id, principal);
        task.setTitle(request.title().trim());
        task.setDescription(normalizeDescription(request.description()));
        task.setPriority(request.priorityOrDefault());
        task.setStatus(request.statusOrDefault());
        task.setDueDate(request.dueDate());
        return TaskResponse.from(taskRepository.save(task));
    }

    public void deleteTask(Long id, UserPrincipal principal) {
        Task task = findOwnedTask(id, principal);
        taskRepository.delete(task);
    }

    private Task findOwnedTask(Long id, UserPrincipal principal) {
        return taskRepository.findByIdAndUserId(id, principal.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private String normalizeDescription(String description) {
        return description == null ? "" : description.trim();
    }
}
