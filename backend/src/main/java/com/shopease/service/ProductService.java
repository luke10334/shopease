package com.shopease.service;

import com.shopease.dto.request.ProductRequest;
import com.shopease.dto.response.*;
import com.shopease.entity.*;
import com.shopease.exception.*;
import com.shopease.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public PagedResponse<ProductResponse> findAll(int page, int size, String sortBy, Long categoryId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<Product> result = (categoryId != null)
            ? productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable)
            : productRepository.findByActiveTrue(pageable);
        return toPagedResponse(result);
    }

    public PagedResponse<ProductResponse> search(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return toPagedResponse(productRepository.searchActive(query, pageable));
    }

    public ProductResponse findById(Long id) {
        return toResponse(getActiveOrThrow(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        Category category = getCategoryOrThrow(req.getCategoryId());
        Product p = Product.builder()
            .name(req.getName())
            .description(req.getDescription())
            .price(req.getPrice())
            .stockQuantity(req.getStockQuantity())
            .imageUrl(req.getImageUrl())
            .category(category)
            .active(true)
            .build();
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest req) {
        Product p = getOrThrow(id);
        Category category = getCategoryOrThrow(req.getCategoryId());
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setStockQuantity(req.getStockQuantity());
        p.setImageUrl(req.getImageUrl());
        p.setCategory(category);
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public void deactivate(Long id) {
        Product p = getOrThrow(id);
        p.setActive(false);
        productRepository.save(p);
    }

    private Product getActiveOrThrow(Long id) {
        Product p = getOrThrow(id);
        if (!p.getActive()) throw new ResourceNotFoundException("Product", id);
        return p;
    }

    private Product getOrThrow(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private Category getCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    private PagedResponse<ProductResponse> toPagedResponse(Page<Product> page) {
        return PagedResponse.<ProductResponse>builder()
            .content(page.getContent().stream().map(this::toResponse).toList())
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .last(page.isLast())
            .build();
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
            .id(p.getId())
            .name(p.getName())
            .description(p.getDescription())
            .price(p.getPrice())
            .stockQuantity(p.getStockQuantity())
            .imageUrl(p.getImageUrl())
            .active(p.getActive())
            .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
            .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
            .createdAt(p.getCreatedAt())
            .build();
    }
}
