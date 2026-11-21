package com.shopease.config;

import com.shopease.entity.*;
import com.shopease.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserRepository userRepo;
    private final CategoryRepository catRepo;
    private final ProductRepository productRepo;
    private final CartRepository cartRepo;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("!test")
    CommandLineRunner seedData() {
        return args -> {
            if (userRepo.count() > 0) return;
            log.info("Seeding initial data...");

            // Admin user
            User admin = User.builder()
                .name("Admin User")
                .email("admin@shopease.com")
                .password(passwordEncoder.encode("Admin@123"))
                .role(com.shopease.entity.Role.ADMIN)
                .build();
            userRepo.save(admin);
            cartRepo.save(Cart.builder().user(admin).build());

            // Regular user
            User user = User.builder()
                .name("John Doe")
                .email("john@example.com")
                .password(passwordEncoder.encode("User@1234"))
                .role(com.shopease.entity.Role.USER)
                .build();
            userRepo.save(user);
            cartRepo.save(Cart.builder().user(user).build());

            // Categories
            Category electronics = catRepo.save(Category.builder()
                .name("Electronics").description("Gadgets and devices").build());
            Category clothing = catRepo.save(Category.builder()
                .name("Clothing").description("Apparel and fashion").build());
            Category books = catRepo.save(Category.builder()
                .name("Books").description("Physical and digital books").build());

            // Products
            productRepo.saveAll(List.of(
                Product.builder().name("Wireless Headphones").description("Noise-cancelling BT headphones")
                    .price(new BigDecimal("4999.00")).stockQuantity(50).category(electronics)
                    .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400").active(true).build(),
                Product.builder().name("Mechanical Keyboard").description("TKL mechanical keyboard, blue switches")
                    .price(new BigDecimal("3499.00")).stockQuantity(30).category(electronics)
                    .imageUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400").active(true).build(),
                Product.builder().name("USB-C Hub").description("7-in-1 USB-C multiport adapter")
                    .price(new BigDecimal("1299.00")).stockQuantity(100).category(electronics)
                    .imageUrl("https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=400").active(true).build(),
                Product.builder().name("Classic White T-Shirt").description("100% cotton, unisex")
                    .price(new BigDecimal("499.00")).stockQuantity(200).category(clothing)
                    .imageUrl("https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400").active(true).build(),
                Product.builder().name("Denim Jacket").description("Premium slim-fit denim")
                    .price(new BigDecimal("2199.00")).stockQuantity(75).category(clothing)
                    .imageUrl("https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=400").active(true).build(),
                Product.builder().name("Clean Code").description("A handbook of agile software craftsmanship — Robert C. Martin")
                    .price(new BigDecimal("799.00")).stockQuantity(60).category(books)
                    .imageUrl("https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400").active(true).build(),
                Product.builder().name("Design Patterns").description("Gang of Four — 23 classic software patterns")
                    .price(new BigDecimal("999.00")).stockQuantity(45).category(books)
                    .imageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400").active(true).build()
            ));

            log.info("Seed data loaded: 2 users, 3 categories, 7 products");
        };
    }
}
