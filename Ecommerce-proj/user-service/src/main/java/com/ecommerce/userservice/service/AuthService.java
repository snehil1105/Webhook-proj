package com.ecommerce.userservice.service;

import com.ecommerce.userservice.entity.Seller;
import com.ecommerce.userservice.repository.SellerRepository;
import com.ecommerce.userservice.entity.User;
import com.ecommerce.userservice.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SellerRepository sellerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User register(String email, String rawPassword, String name, String roleString) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }
        User.Role role = User.Role.valueOf(roleString.toUpperCase());
        String hashed = passwordEncoder.encode(rawPassword);
        User user = User.builder()
                .email(email)
                .passwordHash(hashed)
                .name(name)
                .role(role)
                .build();
        User savedUser = userRepository.save(user);
        
        if (role == User.Role.RETAILER) {
            Seller seller = Seller.builder()
                    .userId(savedUser.getId())
                    .name(name + "'s Shop")
                    .description("Default shop description.")
                    .logoUrl("")
                    .contactInfo(email)
                    .build();
            sellerRepository.save(seller);
        }
        
        return savedUser;
    }
}