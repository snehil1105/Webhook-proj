package com.webhook.userService.config;

import com.webhook.userService.entity.User;
import com.webhook.userService.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail("admin@auraretail.com")) {
            User admin = User.builder()
                    .name("Aura Admin")
                    .email("admin@auraretail.com")
                    .password(passwordEncoder.encode("AuraDevConsole2026!"))
                    .build();
            userRepository.save(admin);
        }
    }
}
