package com.shopease.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String imageUrl;
    private Boolean active;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}
