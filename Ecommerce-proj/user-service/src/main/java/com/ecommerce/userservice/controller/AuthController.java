package com.ecommerce.userservice.controller;

import com.ecommerce.userservice.dto.LoginRequest;
import com.ecommerce.userservice.dto.LoginResponse;
import com.ecommerce.userservice.dto.RegisterRequest;
import com.ecommerce.userservice.entity.User;
import com.ecommerce.userservice.exception.AppException;
import com.ecommerce.userservice.repository.UserRepository;
import com.ecommerce.userservice.service.AuthService;
import com.ecommerce.userservice.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/business/auth/register")
    public ResponseEntity<LoginResponse> registerRetailer(@RequestBody RegisterRequest request) {
        try {
            User user = authService.register(
                    request.getEmail(),
                    request.getPassword(),
                    request.getName(),
                    "RETAILER"
            );
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
            return ResponseEntity.ok(new LoginResponse("Bearer " + token, user.getEmail(), user.getRole()));
        } catch (Exception e) {
            throw new AppException(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/customer/auth/register")
    public ResponseEntity<LoginResponse> registerCustomer(@RequestBody RegisterRequest request) {
        try {
            User user = authService.register(
                    request.getEmail(),
                    request.getPassword(),
                    request.getName(),
                    "CUSTOMER"
            );
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
            return ResponseEntity.ok(new LoginResponse("Bearer " + token, user.getEmail(), user.getRole()));
        } catch (Exception e) {
            throw new AppException(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/business/auth/login")
    public ResponseEntity<LoginResponse> loginRetailer(@RequestBody LoginRequest request) {
        return login(request, "RETAILER");
    }

    @PostMapping("/customer/auth/login")
    public ResponseEntity<LoginResponse> loginCustomer(@RequestBody LoginRequest request) {
        return login(request, "CUSTOMER");
    }

    private ResponseEntity<LoginResponse> login(LoginRequest request, String expectedRole) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (!user.getRole().name().equals(expectedRole)) {
                throw new RuntimeException("Invalid role for this login endpoint");
            }
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
            return ResponseEntity.ok(new LoginResponse("Bearer " + token, user.getEmail(), user.getRole()));
        } catch (Exception e) {
            throw new AppException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }
    }

    @GetMapping("/customer/profile")
    public ResponseEntity<?> getCustomerProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        java.util.UUID userId = java.util.UUID.fromString(authentication.getPrincipal().toString());
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        User user = opt.get();
        return ResponseEntity.ok(java.util.Map.of("id", user.getId(), "email", user.getEmail(), "name", user.getName()));
    }

    @PutMapping("/customer/profile")
    public ResponseEntity<?> updateCustomerProfile(@RequestBody java.util.Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        java.util.UUID userId = java.util.UUID.fromString(authentication.getPrincipal().toString());
        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        User user = opt.get();
        
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        
        if (name != null && !name.trim().isEmpty()) {
            user.setName(name);
        }
        if (email != null && !email.trim().isEmpty()) {
            Optional<User> existing = userRepository.findByEmail(email);
            if (existing.isPresent() && !existing.get().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Email already in use"));
            }
            user.setEmail(email);
        }
        if (password != null && !password.trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(password));
        }
        
        User saved = userRepository.save(user);
        
        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail(), saved.getRole().name());
        return ResponseEntity.ok(java.util.Map.of(
            "token", "Bearer " + token,
            "email", saved.getEmail(),
            "name", saved.getName()
        ));
    }
}