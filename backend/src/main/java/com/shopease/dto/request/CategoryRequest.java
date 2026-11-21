package com.shopease.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 80)
    private String name;

    @Size(max = 255)
    private String description;
}
