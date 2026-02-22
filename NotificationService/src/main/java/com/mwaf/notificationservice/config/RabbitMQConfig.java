package com.mwaf.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Auth Service Constants
    public static final String AUTH_EXCHANGE = "auth-exchange";
    public static final String USER_REGISTERED_QUEUE = "notification-user-registered-queue";
    public static final String USER_REGISTERED_ROUTING_KEY = "auth.user.registered";

    // Order Service Constants
    public static final String ORDER_EXCHANGE = "order-exchange";
    public static final String ORDER_PLACED_QUEUE = "notification-order-placed-queue";
    public static final String ORDER_PLACED_ROUTING_KEY = "order.placed";
    public static final String ORDER_STATUS_CHANGED_QUEUE = "notification-order-status-changed-queue";
    public static final String ORDER_STATUS_CHANGED_ROUTING_KEY = "order.status.changed";

    // DLQ Constants
    public static final String DLX_EXCHANGE = "dlx.exchange";
    public static final String USER_REGISTERED_DLQ = "notification-user-registered-dlq";
    public static final String DLQ_USER_REGISTERED_ROUTING_KEY = "auth.user.registered.dlq";
    public static final String ORDER_PLACED_DLQ = "notification-order-placed-dlq";
    public static final String DLQ_ORDER_PLACED_ROUTING_KEY = "order.placed.dlq";
    public static final String ORDER_STATUS_CHANGED_DLQ = "notification-order-status-changed-dlq";
    public static final String DLQ_ORDER_STATUS_CHANGED_ROUTING_KEY = "order.status.changed.dlq";

    // Auth Service Beans
    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE);
    }

    @Bean
    public Queue userRegisteredQueue() {
        return QueueBuilder.durable(USER_REGISTERED_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ_USER_REGISTERED_ROUTING_KEY)
                .build();
    }

    @Bean
    public Binding userRegisteredBinding(Queue userRegisteredQueue, TopicExchange authExchange) {
        return BindingBuilder.bind(userRegisteredQueue)
                .to(authExchange)
                .with(USER_REGISTERED_ROUTING_KEY);
    }

    // Order Service Beans
    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE);
    }

    @Bean
    public Queue orderPlacedQueue() {
        return QueueBuilder.durable(ORDER_PLACED_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ_ORDER_PLACED_ROUTING_KEY)
                .build();
    }

    @Bean
    public Binding orderPlacedBinding(Queue orderPlacedQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(orderPlacedQueue)
                .to(orderExchange)
                .with(ORDER_PLACED_ROUTING_KEY);
    }

    @Bean
    public Queue orderStatusChangedQueue() {
        return QueueBuilder.durable(ORDER_STATUS_CHANGED_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ_ORDER_STATUS_CHANGED_ROUTING_KEY)
                .build();
    }

    @Bean
    public Binding orderStatusChangedBinding(Queue orderStatusChangedQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(orderStatusChangedQueue)
                .to(orderExchange)
                .with(ORDER_STATUS_CHANGED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        org.springframework.amqp.support.converter.DefaultClassMapper classMapper = new org.springframework.amqp.support.converter.DefaultClassMapper();
        classMapper.setTrustedPackages("*");

        java.util.Map<String, Class<?>> idClassMapping = new java.util.HashMap<>();
        idClassMapping.put("com.mwaf.authservice.event.UserRegisteredEvent",
                com.mwaf.notificationservice.event.UserRegisteredEvent.class);
        idClassMapping.put("com.mwaf.orderservice.event.OrderPlacedEvent",
                com.mwaf.notificationservice.event.OrderPlacedEvent.class);
        idClassMapping.put("com.mwaf.orderservice.event.OrderStatusChangedEvent",
                com.mwaf.notificationservice.event.OrderStatusChangedEvent.class);

        classMapper.setIdClassMapping(idClassMapping);
        converter.setClassMapper(classMapper);
        return converter;
    }

    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }

    // DLQ Beans
    @Bean
    public TopicExchange deadLetterExchange() {
        return new TopicExchange(DLX_EXCHANGE);
    }

    @Bean
    public Queue userRegisteredDlq() {
        return QueueBuilder.durable(USER_REGISTERED_DLQ).build();
    }

    @Bean
    public Binding userRegisteredDlqBinding(Queue userRegisteredDlq, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(userRegisteredDlq).to(deadLetterExchange).with(DLQ_USER_REGISTERED_ROUTING_KEY);
    }

    @Bean
    public Queue orderPlacedDlq() {
        return QueueBuilder.durable(ORDER_PLACED_DLQ).build();
    }

    @Bean
    public Binding orderPlacedDlqBinding(Queue orderPlacedDlq, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(orderPlacedDlq).to(deadLetterExchange).with(DLQ_ORDER_PLACED_ROUTING_KEY);
    }

    @Bean
    public Queue orderStatusChangedDlq() {
        return QueueBuilder.durable(ORDER_STATUS_CHANGED_DLQ).build();
    }

    @Bean
    public Binding orderStatusChangedDlqBinding(Queue orderStatusChangedDlq, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(orderStatusChangedDlq).to(deadLetterExchange)
                .with(DLQ_ORDER_STATUS_CHANGED_ROUTING_KEY);
    }

    @Bean
    public org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory factory = new org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        factory.setDefaultRequeueRejected(false);
        return factory;
    }
}
