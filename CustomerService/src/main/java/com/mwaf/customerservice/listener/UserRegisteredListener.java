package com.mwaf.customerservice.listener;

import com.mwaf.customerservice.config.RabbitMQConfig;
import com.mwaf.customerservice.model.Customer;
import com.mwaf.customerservice.event.UserRegisteredEvent;
import com.mwaf.customerservice.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredListener {

    private final CustomerService customerService;

    @RabbitListener(queues = RabbitMQConfig.USER_REGISTERED_QUEUE)
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent for user: {}", event.getUsername());

        try {
            Customer customer = new Customer();
            customer.setUserId(event.getUserId());
            customer.setEmail(event.getEmail());
            customer.setName(event.getName());
            customer.setPhone(event.getPhone());
            customer.setAddress(event.getAddress());

            customerService.createCustomer(customer);
            log.info("Successfully created customer for user: {}", event.getUsername());
        } catch (Exception e) {
            log.error("Failed to create customer for user: {}", event.getUsername(), e);
            // In a real system, you might want to throw the exception to NACK the message
            // and have it retried or dead-lettered.
        }
    }
}
