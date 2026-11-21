package com.shopease.service;

import com.shopease.dto.request.CartItemRequest;
import com.shopease.dto.response.*;
import com.shopease.entity.*;
import com.shopease.exception.*;
import com.shopease.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(Long userId, CartItemRequest req) {
        Cart cart = getCartByUserId(userId);
        Product product = getActiveProductOrThrow(req.getProductId());

        if (product.getStockQuantity() < req.getQuantity()) {
            throw new InsufficientStockException(product.getName(),
                product.getStockQuantity(), req.getQuantity());
        }

        cart.getItems().stream()
            .filter(i -> i.getProduct().getId().equals(req.getProductId()))
            .findFirst()
            .ifPresentOrElse(
                existing -> {
                    int newQty = existing.getQuantity() + req.getQuantity();
                    if (newQty > product.getStockQuantity()) {
                        throw new InsufficientStockException(product.getName(),
                            product.getStockQuantity(), newQty);
                    }
                    existing.setQuantity(newQty);
                },
                () -> {
                    CartItem item = CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(req.getQuantity())
                        .build();
                    cart.getItems().add(item);
                }
            );

        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItem(Long userId, Long itemId, Integer quantity) {
        Cart cart = getCartByUserId(userId);
        CartItem item = cart.getItems().stream()
            .filter(i -> i.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (quantity == 0) {
            cart.getItems().remove(item);
        } else {
            if (item.getProduct().getStockQuantity() < quantity) {
                throw new InsufficientStockException(item.getProduct().getName(),
                    item.getProduct().getStockQuantity(), quantity);
            }
            item.setQuantity(quantity);
        }
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long itemId) {
        Cart cart = getCartByUserId(userId);
        boolean removed = cart.getItems().removeIf(i -> i.getId().equals(itemId));
        if (!removed) throw new ResourceNotFoundException("Cart item not found");
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));
    }

    private Product getActiveProductOrThrow(Long id) {
        return productRepository.findById(id)
            .filter(Product::getActive)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
            .map(i -> {
                BigDecimal subtotal = i.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(i.getQuantity()));
                return CartItemResponse.builder()
                    .id(i.getId())
                    .productId(i.getProduct().getId())
                    .productName(i.getProduct().getName())
                    .productImageUrl(i.getProduct().getImageUrl())
                    .unitPrice(i.getProduct().getPrice())
                    .quantity(i.getQuantity())
                    .subtotal(subtotal)
                    .build();
            }).toList();

        BigDecimal total = items.stream()
            .map(CartItemResponse::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
            .id(cart.getId())
            .items(items)
            .total(total)
            .itemCount(items.size())
            .build();
    }
}
