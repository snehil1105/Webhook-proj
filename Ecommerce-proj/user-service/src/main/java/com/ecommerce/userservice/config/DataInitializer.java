package com.ecommerce.userservice.config;

import com.ecommerce.userservice.entity.Seller;
import com.ecommerce.userservice.entity.User;
import com.ecommerce.userservice.repository.SellerRepository;
import com.ecommerce.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SellerRepository sellerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Seed / Update Customer Demo Account
            User customer = userRepository.findByEmail("recruiter.customer@example.com")
                    .orElseGet(() -> User.builder()
                            .name("Recruiter Customer")
                            .email("recruiter.customer@example.com")
                            .role(User.Role.CUSTOMER)
                            .build());
            customer.setPasswordHash(passwordEncoder.encode("password123"));
            userRepository.save(customer);

            // Seed / Update Seller Demo Account
            User sellerUser = userRepository.findByEmail("recruiter.seller@example.com")
                    .orElseGet(() -> User.builder()
                            .name("Recruiter Seller")
                            .email("recruiter.seller@example.com")
                            .role(User.Role.RETAILER)
                            .build());
            sellerUser.setPasswordHash(passwordEncoder.encode("password123"));
            User savedSeller = userRepository.save(sellerUser);

            if (sellerRepository.findByUserId(savedSeller.getId()).isEmpty()) {
                Seller seller = Seller.builder()
                        .userId(savedSeller.getId())
                        .name("Aura Premium Boutique")
                        .description("Exclusive curated lifestyle goods and aesthetic products.")
                        .contactInfo("recruiter.seller@example.com")
                        .build();
                sellerRepository.save(seller);
            }
        } catch (Exception e) {
            System.err.println("DataInitializer warning: " + e.getMessage());
        }
    }
}
