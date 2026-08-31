package com.ecommerce.productservice.controller;

import com.ecommerce.productservice.dto.ProductRequest;
import com.ecommerce.productservice.dto.ProductResponse;
import com.ecommerce.productservice.security.JwtAuthFilter;
import com.ecommerce.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user");
        }
        return UUID.fromString(authentication.getPrincipal().toString());
    }

    // RETAILER endpoints
    @PostMapping("/business/products")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        UUID retailerId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(retailerId, request));
    }

    @PutMapping("/business/products/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        UUID retailerId = getCurrentUserId();
        return ResponseEntity.ok(productService.updateProduct(retailerId, id, request));
    }

    @DeleteMapping("/business/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        UUID retailerId = getCurrentUserId();
        productService.deleteProduct(retailerId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/business/products/mine")
    public ResponseEntity<List<ProductResponse>> getMyProducts() {
        UUID retailerId = getCurrentUserId();
        return ResponseEntity.ok(productService.getMyProducts(retailerId));
    }

    @PutMapping("/business/products/{id}/stock")
    public ResponseEntity<ProductResponse> updateStock(@PathVariable UUID id, @RequestParam int stockQuantity) {
        UUID retailerId = getCurrentUserId();
        return ResponseEntity.ok(productService.updateStock(retailerId, id, stockQuantity));
    }

    // PUBLIC endpoints
    @GetMapping("/public/products")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }

    @GetMapping("/public/products/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/public/products/search")
    public ResponseEntity<List<ProductResponse>> searchProducts(@RequestParam String q) {
        return ResponseEntity.ok(productService.searchProducts(q));
    }
}