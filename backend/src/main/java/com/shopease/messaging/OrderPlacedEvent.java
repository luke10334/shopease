package com.shopease.messaging;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderPlacedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private String userName;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private LocalDateTime placedAt;
}
