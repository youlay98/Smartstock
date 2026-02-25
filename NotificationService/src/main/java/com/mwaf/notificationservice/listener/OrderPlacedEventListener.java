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
    private final com.mwaf.notificationservice.client.CustomerServiceClient customerServiceClient;

    @RabbitListener(queues = RabbitMQConfig.ORDER_PLACED_QUEUE)
    public void handleOrderPlacedEvent(OrderPlacedEvent event) {
        log.info("Received OrderPlacedEvent for order: {}", event.getOrderId());
        try {
            String customerEmail = "customer@example.com"; // Default fallback
            Long userId = null;
            if (event.getCustomerId() != null) {
                try {
                    com.mwaf.notificationservice.dto.CustomerDTO customer = customerServiceClient
                            .getCustomerById(event.getCustomerId());
                    if (customer != null) {
                        if (customer.getEmail() != null) {
                            customerEmail = customer.getEmail();
                        }
                        userId = customer.getUserId();
                    }
                } catch (Exception e) {
                    log.error("Failed to fetch customer email for customerId: {}", event.getCustomerId(), e);
                }
            }

            notificationService.sendOrderConfirmationEmail(event, customerEmail, userId);
            notificationService.sendAdminOrderNotification(event, customerEmail, event.getCustomerId());
        } catch (Exception e) {
            log.error("Error processing OrderPlacedEvent for order: {}", event.getOrderId(), e);
            throw new RuntimeException("Failed to process OrderPlacedEvent, routing to DLQ", e);
        }
    }
}
