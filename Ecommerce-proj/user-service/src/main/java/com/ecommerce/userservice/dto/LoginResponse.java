package com.ecommerce.userservice.dto;

import com.ecommerce.userservice.entity.User;

public class LoginResponse {

    private String token;
    private String email;
    private User.Role role;

    public LoginResponse(String token, String email, User.Role role) {
        this.token = token;
        this.email = email;
        this.role = role;
    }

    public LoginResponse(String message) {
        this.token = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public User.Role getRole() {
        return role;
    }

    public void setRole(User.Role role) {
        this.role = role;
    }
}