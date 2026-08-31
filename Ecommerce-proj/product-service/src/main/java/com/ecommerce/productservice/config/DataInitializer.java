package com.ecommerce.productservice.config;

import com.ecommerce.productservice.entity.Product;
import com.ecommerce.productservice.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    @Override
    public void run(String... args) throws Exception {
        if (productRepository.count() == 0) {
            UUID defaultRetailerId = UUID.fromString("11111111-1111-1111-1111-111111111111");

            Product p1 = Product.builder()
                    .retailerId(defaultRetailerId)
                    .name("Minimalist Ceramic Coffee Mug")
                    .description("Handcrafted matte ceramic coffee mug designed for aesthetic morning brews.")
                    .price(new BigDecimal("24.99"))
                    .stockQuantity(50)
                    .lowStockThreshold(5)
                    .category("Home & Kitchen")
                    .images(List.of("https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800"))
                    .highlights(List.of("Handmade Ceramic", "350ml Capacity", "Dishwasher Safe"))
                    .specifications(Map.of("Material", "Ceramic", "Color", "Matte Sand"))
                    .brand("Aura Home")
                    .isActive(true)
                    .returnType("SEVEN_DAYS_RETURN")
                    .returnPolicy("RETURN")
                    .build();

            Product p2 = Product.builder()
                    .retailerId(defaultRetailerId)
                    .name("Nordic Ambient Desk Lamp")
                    .description("Soft warm LED ambient table lamp with natural oak wood finish base.")
                    .price(new BigDecimal("79.99"))
                    .stockQuantity(30)
                    .lowStockThreshold(3)
                    .category("Electronics")
                    .images(List.of("https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800"))
                    .highlights(List.of("Warm LED 3000K", "Dimmable Touch Sensor", "Solid Oak Wood"))
                    .specifications(Map.of("Power", "12W", "Voltage", "110-240V"))
                    .brand("Lumina")
                    .isActive(true)
                    .returnType("SEVEN_DAYS_RETURN")
                    .returnPolicy("REPLACE")
                    .build();

            Product p3 = Product.builder()
                    .retailerId(defaultRetailerId)
                    .name("Aesthetic Linen Throw Blanket")
                    .description("100% organic stonewashed French flax linen throw blanket for cozy spaces.")
                    .price(new BigDecimal("59.50"))
                    .stockQuantity(40)
                    .lowStockThreshold(5)
                    .category("Clothes")
                    .images(List.of("https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"))
                    .highlights(List.of("100% French Flax", "Breathable & Soft", "Pre-washed Finish"))
                    .specifications(Map.of("Dimensions", "130x170 cm", "Fabric", "Linen"))
                    .brand("Aura Living")
                    .isActive(true)
                    .returnType("SEVEN_DAYS_RETURN")
                    .returnPolicy("RETURN")
                    .build();

            productRepository.saveAll(List.of(p1, p2, p3));
        }
    }
}
