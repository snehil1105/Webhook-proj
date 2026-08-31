package com.ecommerce.productservice.service;

import com.ecommerce.productservice.dto.ProductRequest;
import com.ecommerce.productservice.dto.ProductResponse;
import com.ecommerce.productservice.entity.Product;
import com.ecommerce.productservice.exception.AppException;
import com.ecommerce.productservice.repository.ProductRepository;
import com.ecommerce.productservice.repository.ReviewRepository;
import com.ecommerce.productservice.entity.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    private static final String CACHE_ALL_KEY = "products:all";

    @Transactional
    public ProductResponse createProduct(UUID retailerId, ProductRequest request) {
        Product product = Product.builder()
                .retailerId(retailerId)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .lowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5)
                .category(request.getCategory())
                .images(request.getImages() != null ? request.getImages() : new java.util.ArrayList<>())
                .highlights(request.getHighlights() != null ? request.getHighlights() : new java.util.ArrayList<>())
                .specifications(request.getSpecifications() != null ? request.getSpecifications() : new java.util.HashMap<>())
                .brand(request.getBrand())
                .returnType(request.getReturnType() != null ? request.getReturnType() : "NO_RETURN")
                .returnPolicy(request.getReturnPolicy() != null ? request.getReturnPolicy() : "RETURN")
                .isActive(true)
                .build();
        Product saved = productRepository.save(product);
        invalidateCache();
        checkStockAndPublishEvents(saved);
        return mapToResponse(saved);
    }
  
    @Transactional
    public ProductResponse updateProduct(UUID retailerId, UUID productId, ProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product not found", HttpStatus.NOT_FOUND));
        if (!product.getRetailerId().equals(retailerId)) {
            throw new AppException("You can only update your own products", HttpStatus.FORBIDDEN);
        }
        java.math.BigDecimal oldPrice = product.getPrice();
        int oldStock = product.getStockQuantity();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        if (request.getLowStockThreshold() != null) {
            product.setLowStockThreshold(request.getLowStockThreshold());
        }
        product.setCategory(request.getCategory());
        if (request.getImages() != null) {
            product.setImages(request.getImages());
        }
        if (request.getHighlights() != null) {
            product.setHighlights(request.getHighlights());
        }
        if (request.getSpecifications() != null) {
            product.setSpecifications(request.getSpecifications());
        }
        product.setBrand(request.getBrand());
        if (request.getReturnType() != null) {
            product.setReturnType(request.getReturnType());
        }
        if (request.getReturnPolicy() != null) {
            product.setReturnPolicy(request.getReturnPolicy());
        }
        Product saved = productRepository.save(product);

        // Publish events
        if (oldPrice != null && saved.getPrice() != null && oldPrice.compareTo(saved.getPrice()) != 0) {
            try {
                kafkaProducerService.publishProductPriceChanged(
                    saved.getId(),
                    saved.getRetailerId(),
                    saved.getName(),
                    oldPrice.doubleValue(),
                    saved.getPrice().doubleValue()
                );
            } catch (Exception e) {
                System.err.println("Failed to publish price change: " + e.getMessage());
            }
        }
        if (oldStock != saved.getStockQuantity()) {
            checkStockAndPublishEvents(saved);
        }

        invalidateCache();
        redisTemplate.delete("products:" + productId);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteProduct(UUID retailerId, UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product not found", HttpStatus.NOT_FOUND));
        if (!product.getRetailerId().equals(retailerId)) {
            throw new AppException("You can only delete your own products", HttpStatus.FORBIDDEN);
        }
        product.setActive(false);
        productRepository.save(product);
        invalidateCache();
        redisTemplate.delete("products:" + productId);
    }

    @Transactional
    public ProductResponse updateStock(UUID retailerId, UUID productId, int stockQuantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product not found", HttpStatus.NOT_FOUND));
        if (!product.getRetailerId().equals(retailerId)) {
            throw new AppException("You can only update your own products", HttpStatus.FORBIDDEN);
        }
        int oldStock = product.getStockQuantity();
        product.setStockQuantity(stockQuantity);
        Product saved = productRepository.save(product);
        if (oldStock != saved.getStockQuantity()) {
            checkStockAndPublishEvents(saved);
        }
        redisTemplate.delete("products:" + productId);
        invalidateCache();
        return mapToResponse(saved);
    }

    public List<ProductResponse> getMyProducts(UUID retailerId) {
        return productRepository.findByRetailerIdAndIsActiveTrue(retailerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public List<ProductResponse> getAllActiveProducts() {
        Object cached = redisTemplate.opsForValue().get(CACHE_ALL_KEY);
        if (cached != null) {
            return (List<ProductResponse>) cached;
        }
        List<ProductResponse> result = productRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        redisTemplate.opsForValue().set(CACHE_ALL_KEY, result);
        return result;
    }

    public ProductResponse getProductById(UUID productId) {
        Object cached = redisTemplate.opsForValue().get("products:" + productId);
        if (cached != null) {
            return (ProductResponse) cached;
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product not found", HttpStatus.NOT_FOUND));
        if (!product.isActive()) {
            throw new AppException("Product not found", HttpStatus.NOT_FOUND);
        }
        ProductResponse response = mapToResponse(product);
        redisTemplate.opsForValue().set("products:" + productId, response);
        return response;
    }

    public List<ProductResponse> searchProducts(String query) {
        return productRepository
                .findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(query, query).stream()
                .filter(Product::isActive)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void checkStockAndPublishEvents(Product product) {
        try {
            if (product.getStockQuantity() == 0) {
                kafkaProducerService.publishProductOutOfStock(
                    product.getId(),
                    product.getRetailerId(),
                    product.getName()
                );
            } else if (product.getStockQuantity() <= product.getLowStockThreshold()) {
                kafkaProducerService.publishInventoryLowStock(
                    product.getId(),
                    product.getRetailerId(),
                    product.getName(),
                    product.getStockQuantity(),
                    product.getLowStockThreshold()
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to publish stock events: " + e.getMessage());
        }
    }

    private void invalidateCache() {
        redisTemplate.delete(CACHE_ALL_KEY);
    }

    private ProductResponse mapToResponse(Product product) {
        List<Review> reviews = reviewRepository != null ? reviewRepository.findByProductId(product.getId()) : List.of();
        double avg = 0.0;
        if (!reviews.isEmpty()) {
            double totalStars = reviews.stream().mapToDouble(Review::getRating).sum();
            avg = totalStars / reviews.size();
        }
        ProductResponse response = new ProductResponse(
                product.getId(),
                product.getRetailerId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getLowStockThreshold(),
                product.getCategory(),
                product.isActive(),
                product.getCreatedAt(),
                product.getImages(),
                product.getHighlights(),
                product.getSpecifications(),
                product.getBrand(),
                avg,
                reviews.size()
        );
        response.setReturnType(product.getReturnType());
        response.setReturnPolicy(product.getReturnPolicy());
        return response;
    }
}