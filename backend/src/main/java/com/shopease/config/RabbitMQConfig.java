package com.shopease.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.*;
import org.springframework.context.annotation.*;

@Configuration
public class RabbitMQConfig {

    public static final String ORDER_EXCHANGE   = "shopease.orders";
    public static final String ORDER_QUEUE      = "order.processing";
    public static final String ORDER_DLQ        = "order.processing.dlq";
    public static final String ORDER_ROUTING_KEY = "order.placed";
    public static final String ORDER_DLQ_ROUTING = "order.dead";

    @Bean
    public DirectExchange orderExchange() {
        return ExchangeBuilder.directExchange(ORDER_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable(ORDER_QUEUE)
            .withArgument("x-dead-letter-exchange", ORDER_EXCHANGE)
            .withArgument("x-dead-letter-routing-key", ORDER_DLQ_ROUTING)
            .build();
    }

    @Bean
    public Queue orderDLQ() {
        return QueueBuilder.durable(ORDER_DLQ).build();
    }

    @Bean
    public Binding orderBinding(Queue orderQueue, DirectExchange orderExchange) {
        return BindingBuilder.bind(orderQueue).to(orderExchange).with(ORDER_ROUTING_KEY);
    }

    @Bean
    public Binding orderDLQBinding(Queue orderDLQ, DirectExchange orderExchange) {
        return BindingBuilder.bind(orderDLQ).to(orderExchange).with(ORDER_DLQ_ROUTING);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        var factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}
