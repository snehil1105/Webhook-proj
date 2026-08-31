package com.webhook.userService.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name= "api_keys")
@Getter 
@Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApiKey {

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)

    private UUID id;

    @ManyToOne(fetch= FetchType.LAZY)
    @JoinColumn(name= "user_id", nullable= false)
    private User user;

    @Column(nullable= false)
    private String keyPrefix;

    @Column(nullable= false)
    private String keyHash;

    @Column(nullable= false)
    private String name;

    @Column(nullable= false)
    private boolean isActive;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime lastUsedAt;

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }



}
