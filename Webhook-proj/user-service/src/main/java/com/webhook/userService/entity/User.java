package com.webhook.userService.entity;

import lombok.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name= "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)

    private UUID id;

    @Column(unique= true, nullable= false)
    private String email;

    @Column(nullable= false)
    private String password;

    @Column(nullable= false)
    private String name;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
