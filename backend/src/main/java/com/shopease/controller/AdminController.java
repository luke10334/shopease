package com.shopease.controller;

import com.shopease.dto.request.UpdateOrderStatusRequest;
import com.shopease.dto.response.*;
import com.shopease.entity.OrderStatus;
import com.shopease.service.*;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only operations")
public class AdminController {

    private final OrderService orderService;
    private final UserService userService;

    @GetMapping("/orders")
    @Operation(summary = "List all orders (Admin)")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> allOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(ApiResponse.success(
            orderService.getAllOrders(page, size, status)));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get any order by ID (Admin)")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
            orderService.getOrderById(null, id, true)));
    }

    @PatchMapping("/orders/{id}/status")
    @Operation(summary = "Update order status (Admin)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Order status updated",
            orderService.updateStatus(id, req.getStatus())));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (Admin)")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> allUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(userService.findAll(page, size)));
    }
}
