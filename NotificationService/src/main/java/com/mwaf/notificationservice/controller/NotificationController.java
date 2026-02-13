package com.mwaf.notificationservice.controller;

import com.mwaf.notificationservice.model.Notification;
import com.mwaf.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
            return ResponseEntity.ok(notifications);
        }
        // Return all notifications if no userId specified
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }


    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotification(@PathVariable Long id) {
        Notification notification = notificationService.getNotificationById(id);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        Notification notification = notificationService.getNotificationById(id);
        return ResponseEntity.ok(notification);
    }
}
