package com.mwaf.notificationservice.service;

import com.mwaf.notificationservice.event.OrderPlacedEvent;
import com.mwaf.notificationservice.event.UserRegisteredEvent;
import com.mwaf.notificationservice.model.Notification;
import com.mwaf.notificationservice.model.NotificationStatus;
import com.mwaf.notificationservice.model.NotificationType;
import com.mwaf.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mwaf.notificationservice.event.OrderStatusChangedEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    public void sendWelcomeEmail(UserRegisteredEvent event) {
        log.info("Sending welcome email to: {}", event.getEmail());

        String subject = "Welcome to SmartStock!";
        String content = buildWelcomeEmailContent(event);

        Notification notification = createNotification(
                NotificationType.EMAIL,
                event.getEmail(),
                event.getUserId(),
                subject,
                content);

        try {
            emailService.sendEmail(event.getEmail(), subject, content);
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            log.info("Welcome email sent successfully to: {}", event.getEmail());
        } catch (Exception e) {
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            log.error("Failed to send welcome email to: {}", event.getEmail(), e);
        } finally {
            Notification savedNotification = notificationRepository.save(notification);
            broadcastToUser(event.getUserId(), savedNotification);
        }
    }

    public void sendOrderConfirmationEmail(OrderPlacedEvent event, String customerEmail, Long userId) {
        log.info("Sending order confirmation email for order: {} to: {}", event.getOrderId(), customerEmail);

        String subject = "Order Confirmation - Order #" + event.getOrderId();
        String content = buildOrderConfirmationEmailContent(event);

        Notification notification = createNotification(
                NotificationType.EMAIL,
                customerEmail,
                userId,
                subject,
                content);

        try {
            emailService.sendEmail(customerEmail, subject, content);
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            log.info("Order confirmation email sent successfully to: {}", customerEmail);
        } catch (Exception e) {
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            log.error("Failed to send order confirmation email to: {}", customerEmail, e);
        } finally {
            Notification savedNotification = notificationRepository.save(notification);
            // Customer gets user WebSocket broadcast, we don't broadcast this specific
            // email to admins anymore
            broadcastToUser(userId, savedNotification);
        }
    }

    public void sendAdminOrderNotification(OrderPlacedEvent event, String customerEmail, Long customerId) {
        log.info("Sending admin order notification for order: {}", event.getOrderId());

        String subject = "New Order Placed - Order #" + event.getOrderId();
        String content = "Customer " + customerEmail + " (ID: " + customerId + ") has placed a new order #"
                + event.getOrderId() + ".";

        Notification notification = createNotification(
                NotificationType.IN_APP,
                "admin@smartstock.com",
                0L,
                subject,
                content);

        try {
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
        } finally {
            Notification savedNotification = notificationRepository.save(notification);
            broadcastToAdmins(savedNotification);
        }
    }

    public void sendOrderStatusUpdate(OrderStatusChangedEvent event, String customerEmail, Long userId) {
        log.info("Sending order status update for order: {} (Status: {}) to: {}", event.getOrderId(),
                event.getNewStatus(), customerEmail);

        String subject = "Order Status Update - Order #" + event.getOrderId();
        String content = "Your order status has been updated to: " + event.getNewStatus();

        Notification notification = createNotification(
                NotificationType.EMAIL,
                customerEmail,
                userId,
                subject,
                content);

        try {
            // Send email (optional if you want just websockets, but keeping for
            // completeness)
            emailService.sendEmail(customerEmail, subject, content);
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            log.info("Order status update email sent successfully to: {}", customerEmail);
        } catch (Exception e) {
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            log.error("Failed to send order status email to: {}", customerEmail, e);
        } finally {
            Notification savedNotification = notificationRepository.save(notification);
            broadcastToUser(userId, savedNotification);
        }
    }

    private void broadcastToUser(Long userId, Notification notification) {
        if (userId != null) {
            log.info("Broadcasting WebSocket notification to /topic/user.{}", userId);
            messagingTemplate.convertAndSend("/topic/user." + userId, notification);
        }
    }

    private void broadcastToAdmins(Notification notification) {
        log.info("Broadcasting WebSocket notification to /topic/admin.notifications");
        messagingTemplate.convertAndSend("/topic/admin.notifications", notification);
    }

    @Transactional
    public Notification createNotification(NotificationType type, String recipientEmail,
            Long userId, String subject, String content) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRecipientEmail(recipientEmail);
        notification.setRecipientUserId(userId);
        notification.setSubject(subject);
        notification.setContent(content);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));

        if (notification.getStatus() == NotificationStatus.SENT) {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }

    public long getUnreadCountByUserId(Long userId) {
        return notificationRepository.countByRecipientUserIdAndStatusNot(userId, NotificationStatus.READ);
    }

    public long getGlobalUnreadCount() {
        return notificationRepository.countByStatusNot(NotificationStatus.READ);
    }

    private String buildWelcomeEmailContent(UserRegisteredEvent event) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; color: #777; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to SmartStock!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello %s,</h2>
                            <p>Thank you for registering with SmartStock! We're excited to have you on board.</p>
                            <p>Your account has been successfully created with the following details:</p>
                            <ul>
                                <li><strong>Username:</strong> %s</li>
                                <li><strong>Email:</strong> %s</li>
                            </ul>
                            <p>You can now start exploring our products and services!</p>
                            <p>If you have any questions, feel free to reach out to our support team.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 SmartStock. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, event.getName(), event.getUsername(), event.getEmail());
    }

    private String buildOrderConfirmationEmailContent(OrderPlacedEvent event) {
        StringBuilder itemsHtml = new StringBuilder();
        for (OrderPlacedEvent.OrderItemDto item : event.getItems()) {
            itemsHtml.append(String.format(
                    "<li>Product ID: %d - Quantity: %d</li>",
                    item.getProductId(), item.getQuantity()));
        }

        return String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                                .content { padding: 20px; background-color: #f9f9f9; }
                                .order-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
                                .footer { padding: 20px; text-align: center; color: #777; font-size: 12px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>Order Confirmation</h1>
                                </div>
                                <div class="content">
                                    <h2>Thank you for your order!</h2>
                                    <p>Your order has been successfully placed and is being processed.</p>
                                    <div class="order-info">
                                        <h3>Order Details</h3>
                                        <p><strong>Order ID:</strong> #%d</p>
                                        <p><strong>Items:</strong></p>
                                        <ul>%s</ul>
                                    </div>
                                    <p>You will receive another email once your order has been shipped.</p>
                                    <p>Thank you for shopping with SmartStock!</p>
                                </div>
                                <div class="footer">
                                    <p>&copy; 2026 SmartStock. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """,
                event.getOrderId(), itemsHtml.toString());
    }
}
