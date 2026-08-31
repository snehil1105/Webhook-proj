package com.ecommerce.userservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.ecommerce.userservice.util.PayoutDataConverter;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "sellers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column
    private String logoUrl;

    @Column
    private String contactInfo;

    @Column
    private String razorpayKeyId;

    @Column
    private String razorpayKeySecret;

    @Column
    private String razorpayAccountId;

    @Column
    private String accountHolderName;

    @Column
    @Convert(converter = PayoutDataConverter.class)
    private String bankAccountNumber;

    @Column
    @Convert(converter = PayoutDataConverter.class)
    private String ifscCode;

    @Column
    @Convert(converter = PayoutDataConverter.class)
    private String pan;

    @Column
    private String businessName;

    @Column
    private String email;

    @Column
    private String phone;

    @Column
    private String payoutStatus;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;
}
