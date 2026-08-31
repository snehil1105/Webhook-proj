package com.ecommerce.productservice.dto;

import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;
import java.util.List;
import java.util.Map;

public class ProductResponse {

    private UUID id;
    private UUID retailerId;
    private String name;
    private String description;
    private BigDecimal price;
    private int stockQuantity;
    private int lowStockThreshold;
    private String category;
    private boolean isActive;
    private Date createdAt;
    private List<String> images;
    private List<String> highlights;
    private Map<String, String> specifications;
    private String brand;
    private String returnType;
    private String returnPolicy;
    
    // Rating Aggregates
    private double averageRating;
    private int reviewCount;
 
    public ProductResponse() {}

    public ProductResponse(UUID id, UUID retailerId, String name, String description,
                           BigDecimal price, int stockQuantity, int lowStockThreshold, String category, boolean isActive, Date createdAt,
                           List<String> images, List<String> highlights, Map<String, String> specifications, String brand) {
        this.id = id;
        this.retailerId = retailerId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.lowStockThreshold = lowStockThreshold;
        this.category = category;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.images = images;
        this.highlights = highlights;
        this.specifications = specifications;
        this.brand = brand;
    }

    public ProductResponse(UUID id, UUID retailerId, String name, String description,
                           BigDecimal price, int stockQuantity, int lowStockThreshold, String category, boolean isActive, Date createdAt,
                           List<String> images, List<String> highlights, Map<String, String> specifications, String brand,
                           double averageRating, int reviewCount) {
        this(id, retailerId, name, description, price, stockQuantity, lowStockThreshold, category, isActive, createdAt, images, highlights, specifications, brand);
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRetailerId() { return retailerId; }
    public void setRetailerId(UUID retailerId) { this.retailerId = retailerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }

    public int getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(int lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { this.isActive = active; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public List<String> getHighlights() { return highlights; }
    public void setHighlights(List<String> highlights) { this.highlights = highlights; }

    public Map<String, String> getSpecifications() { return specifications; }
    public void setSpecifications(Map<String, String> specifications) { this.specifications = specifications; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
 
    public String getReturnType() { return returnType; }
    public void setReturnType(String returnType) { this.returnType = returnType; }
 
    public String getReturnPolicy() { return returnPolicy; }
    public void setReturnPolicy(String returnPolicy) { this.returnPolicy = returnPolicy; }
}