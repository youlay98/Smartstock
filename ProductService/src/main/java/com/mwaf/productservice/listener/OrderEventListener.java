package com.mwaf.productservice.listener;

import com.mwaf.productservice.config.RabbitMQConfig;
import com.mwaf.productservice.event.OrderPlacedEvent;
import com.mwaf.productservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventListener {

    private final ProductService productService;

    @RabbitListener(queues = RabbitMQConfig.ORDER_PLACED_QUEUE)
    public void handleOrderPlacedEvent(OrderPlacedEvent event) {
        log.info("Received OrderPlacedEvent for order: {}", event.getOrderId());

        // Iterate through items and reduce stock
        // Note: Ideally, this should be idempotent and handle potential partial
        // failures or race conditions.
        // For this implementation, we will iterate and call reduceStock for each item.
        if (event.getItems() != null) {
            for (OrderPlacedEvent.OrderItemDto item : event.getItems()) {
                try {
                    // Assuming ProductService has a method to reduce stock or update quantity
                    // We need to check ProductService interface. If reduceStock doesn't exist,
                    // we'll need to create it.
                    log.info("Reducing stock for product: {} by {}", item.getProductId(), item.getQuantity());
                    productService.reduceStock(item.getProductId(), item.getQuantity());
                } catch (Exception e) {
                    log.error("Failed to reduce stock for product: " + item.getProductId(), e);
                    throw new RuntimeException("Failed to reduce stock, routing to DLQ", e);
                }
            }
        }
    }
}
