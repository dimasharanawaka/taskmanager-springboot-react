package com.dimasha.taskmanager;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must be 255 characters or fewer")
        String title,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description,
        boolean completed
) {
}
