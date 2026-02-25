package com.mwaf.notificationservice.repository;

import com.mwaf.notificationservice.model.Notification;
import com.mwaf.notificationservice.model.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String email);

    List<Notification> findByStatusOrderByCreatedAtDesc(NotificationStatus status);

    long countByStatusNot(NotificationStatus status);

    long countByRecipientUserIdAndStatusNot(Long userId, NotificationStatus status);
}
