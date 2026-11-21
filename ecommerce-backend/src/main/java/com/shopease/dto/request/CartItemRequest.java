package com.shopease.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CartItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 99, message = "Maximum 99 units per item")
    private Integer quantity;
}
