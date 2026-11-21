package com.shopease.controller;

import com.shopease.dto.request.PlaceOrderRequest;
import com.shopease.dto.response.*;
import com.shopease.security.UserPrincipal;
import com.shopease.service.OrderService;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement and history")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Place an order from cart")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PlaceOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Order placed successfully",
                orderService.placeOrder(principal.getId(), req)));
    }

    @GetMapping
    @Operation(summary = "Get my order history")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> myOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            orderService.getMyOrders(principal.getId(), page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
            orderService.getOrderById(principal.getId(), id, false)));
    }
}
