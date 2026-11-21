package com.shopease.messaging;

import com.shopease.config.RabbitMQConfig;
import com.shopease.entity.OrderStatus;
import com.shopease.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {

    private final OrderRepository orderRepository;

    @RabbitListener(queues = RabbitMQConfig.ORDER_QUEUE)
    @Transactional
    public void handleOrderPlaced(OrderPlacedEvent event) {
        log.info("Processing order #{} for user {}", event.getOrderId(), event.getUserEmail());

        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
                log.info("Order #{} confirmed successfully", event.getOrderId());

                // In a real system you'd send email here via a notification service
                sendOrderConfirmationNotification(event);
            }
        });
    }

    private void sendOrderConfirmationNotification(OrderPlacedEvent event) {
        // Simulated: in production, plug in JavaMailSender or an external notification service
        log.info("[NOTIFICATION] Order #{} confirmed for {} | Total: {} | Ship to: {}",
            event.getOrderId(),
            event.getUserEmail(),
            event.getTotalAmount(),
            event.getShippingAddress());
    }
}
