package com.mwaf.notificationservice.client;

import com.mwaf.notificationservice.dto.CustomerDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "customer-service", url = "http://customer-service:8082")
public interface CustomerServiceClient {

    @GetMapping("/api/customers/byUserId/{userId}")
    CustomerDTO getCustomerByUserId(@PathVariable("userId") Long userId);
}
