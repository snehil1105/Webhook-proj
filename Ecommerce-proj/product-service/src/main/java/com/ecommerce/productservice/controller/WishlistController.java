package com.ecommerce.productservice.controller;

import com.ecommerce.productservice.dto.ProductResponse;
import com.ecommerce.productservice.entity.WishlistItem;
import com.ecommerce.productservice.repository.WishlistItemRepository;
import com.ecommerce.productservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class WishlistController {

    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    @Autowired
    private ProductService productService;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user");
        }
        return UUID.fromString(authentication.getPrincipal().toString());
    }

    @GetMapping("/customer/wishlist")
    public ResponseEntity<List<ProductResponse>> getWishlist() {
        UUID customerId = getCurrentUserId();
        List<WishlistItem> items = wishlistItemRepository.findByCustomerId(customerId);
        List<ProductResponse> products = items.stream()
                .map(item -> {
                    try {
                        return productService.getProductById(item.getProductId());
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(p -> p != null)
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @PostMapping("/customer/wishlist")
    public ResponseEntity<Void> addToWishlist(@RequestParam UUID productId) {
        UUID customerId = getCurrentUserId();
        if (!wishlistItemRepository.findByCustomerIdAndProductId(customerId, productId).isPresent()) {
            WishlistItem item = WishlistItem.builder()
                    .customerId(customerId)
                    .productId(productId)
                    .build();
            wishlistItemRepository.save(item);
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/customer/wishlist/{productId}")
    @Transactional
    public ResponseEntity<Void> removeFromWishlist(@PathVariable UUID productId) {
        UUID customerId = getCurrentUserId();
        wishlistItemRepository.deleteByCustomerIdAndProductId(customerId, productId);
        return ResponseEntity.noContent().build();
    }
}
