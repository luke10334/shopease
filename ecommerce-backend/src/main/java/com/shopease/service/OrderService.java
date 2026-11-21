package com.shopease.service;

import com.shopease.dto.request.PlaceOrderRequest;
import com.shopease.dto.response.*;
import com.shopease.entity.*;
import com.shopease.exception.*;
import com.shopease.messaging.*;
import com.shopease.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderEventProducer orderEventProducer;

    @Transactional
    public OrderResponse placeOrder(Long userId, PlaceOrderRequest req) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot place order with an empty cart");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Validate stock and build order items
        Order order = Order.builder()
            .user(user)
            .status(OrderStatus.PENDING)
            .shippingAddress(req.getShippingAddress())
            .totalAmount(BigDecimal.ZERO)
            .build();

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            int requested = cartItem.getQuantity();

            if (!product.getActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' is no longer available");
            }
            if (product.getStockQuantity() < requested) {
                throw new InsufficientStockException(product.getName(),
                    product.getStockQuantity(), requested);
            }

            // Deduct stock
            product.setStockQuantity(product.getStockQuantity() - requested);
            productRepository.save(product);

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(requested));
            total = total.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(requested)
                .priceAtPurchase(product.getPrice())
                .build();
            order.getItems().add(orderItem);
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // Clear cart after order is placed
        cart.getItems().clear();
        cartRepository.save(cart);

        // Publish async event to RabbitMQ
        orderEventProducer.publishOrderPlaced(OrderPlacedEvent.builder()
            .orderId(savedOrder.getId())
            .userId(user.getId())
            .userEmail(user.getEmail())
            .userName(user.getName())
            .totalAmount(total)
            .shippingAddress(req.getShippingAddress())
            .placedAt(LocalDateTime.now())
            .build());

        log.info("Order #{} placed by user {}", savedOrder.getId(), user.getEmail());
        return toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getMyOrders(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> result = orderRepository.findByUserIdWithItems(userId, pageable);
        return toPagedResponse(result);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long userId, Long orderId, boolean isAdmin) {
        Order order = orderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (!isAdmin && !order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied to order #" + orderId);
        }
        return toResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        validateStatusTransition(order.getStatus(), newStatus);
        order.setStatus(newStatus);
        return toResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getAllOrders(int page, int size, OrderStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> result = (status != null)
            ? orderRepository.findByStatus(status, pageable)
            : orderRepository.findAll(pageable);
        return toPagedResponse(result);
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING    -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED  -> next == OrderStatus.PROCESSING || next == OrderStatus.CANCELLED;
            case PROCESSING -> next == OrderStatus.SHIPPED;
            case SHIPPED    -> next == OrderStatus.DELIVERED;
            default -> false;
        };
        if (!valid) {
            throw new BadRequestException("Cannot transition order from " + current + " to " + next);
        }
    }

    private PagedResponse<OrderResponse> toPagedResponse(Page<Order> page) {
        return PagedResponse.<OrderResponse>builder()
            .content(page.getContent().stream().map(this::toResponse).toList())
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .last(page.isLast())
            .build();
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream()
            .map(i -> OrderItemResponse.builder()
                .id(i.getId())
                .productId(i.getProduct().getId())
                .productName(i.getProduct().getName())
                .quantity(i.getQuantity())
                .priceAtPurchase(i.getPriceAtPurchase())
                .subtotal(i.getPriceAtPurchase().multiply(BigDecimal.valueOf(i.getQuantity())))
                .build())
            .toList();

        return OrderResponse.builder()
            .id(o.getId())
            .userId(o.getUser().getId())
            .userEmail(o.getUser().getEmail())
            .status(o.getStatus().name())
            .totalAmount(o.getTotalAmount())
            .shippingAddress(o.getShippingAddress())
            .createdAt(o.getCreatedAt())
            .updatedAt(o.getUpdatedAt())
            .items(items)
            .build();
    }
}
