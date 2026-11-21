package com.shopease.messaging;

import com.shopease.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public void publishOrderPlaced(OrderPlacedEvent event) {
        log.info("Publishing order-placed event for order #{}", event.getOrderId());
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.ORDER_EXCHANGE,
            RabbitMQConfig.ORDER_ROUTING_KEY,
            event
        );
    }
}
