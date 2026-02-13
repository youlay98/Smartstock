package com.mwaf.notificationservice.listener;

import com.mwaf.notificationservice.config.RabbitMQConfig;
import com.mwaf.notificationservice.event.UserRegisteredEvent;
import com.mwaf.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredEventListener {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.USER_REGISTERED_QUEUE)
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent for user: {}", event.getEmail());
        try {
            notificationService.sendWelcomeEmail(event);
        } catch (Exception e) {
            log.error("Error processing UserRegisteredEvent for user: {}", event.getEmail(), e);
        }
    }
}
