package com.mwaf.notificationservice.listener;

import com.mwaf.notificationservice.config.RabbitMQConfig;
import com.mwaf.notificationservice.event.OrderStatusChangedEvent;
import com.mwaf.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderStatusChangedEventListener {

    private final NotificationService notificationService;
    private final com.mwaf.notificationservice.client.CustomerServiceClient customerServiceClient;

    @RabbitListener(queues = RabbitMQConfig.ORDER_STATUS_CHANGED_QUEUE)
    public void handleOrderStatusChangedEvent(OrderStatusChangedEvent event) {
        log.info("Received OrderStatusChangedEvent for order: {} to status {}", event.getOrderId(),
                event.getNewStatus());
        try {
            String customerEmail = "customer@example.com";
            if (event.getCustomerId() != null) {
                try {
                    com.mwaf.notificationservice.dto.CustomerDTO customer = customerServiceClient
                            .getCustomerByUserId(event.getCustomerId());
                    if (customer != null && customer.getEmail() != null) {
                        customerEmail = customer.getEmail();
                    }
                } catch (Exception e) {
                    log.error("Failed to fetch customer email for customerId: {}", event.getCustomerId(), e);
                }
            }

            notificationService.sendOrderStatusUpdate(event, customerEmail);
        } catch (Exception e) {
            log.error("Error processing OrderStatusChangedEvent for order: {}", event.getOrderId(), e);
            throw new RuntimeException("Failed to process OrderStatusChangedEvent, routing to DLQ", e);
        }
    }
}
