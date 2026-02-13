package com.mwaf.notificationservice.listener;

import com.mwaf.notificationservice.config.RabbitMQConfig;
import com.mwaf.notificationservice.event.OrderPlacedEvent;
import com.mwaf.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderPlacedEventListener {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.ORDER_PLACED_QUEUE)
    public void handleOrderPlacedEvent(OrderPlacedEvent event) {
        log.info("Received OrderPlacedEvent for order: {}", event.getOrderId());
        try {
            // TODO: In a real implementation, we would fetch customer email from CustomerService
            // For now, we'll use a placeholder or skip email sending if customerId is not resolved
            // You can enhance this by adding a Feign client to CustomerService
            String customerEmail = "customer@example.com"; // Placeholder
            notificationService.sendOrderConfirmationEmail(event, customerEmail);
        } catch (Exception e) {
            log.error("Error processing OrderPlacedEvent for order: {}", event.getOrderId(), e);
        }
    }
}
