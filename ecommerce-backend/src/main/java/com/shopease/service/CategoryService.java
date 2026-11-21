package com.shopease.service;

import com.shopease.dto.request.CategoryRequest;
import com.shopease.dto.response.CategoryResponse;
import com.shopease.entity.Category;
import com.shopease.exception.*;
import com.shopease.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public CategoryResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.getName())) {
            throw new ConflictException("Category already exists: " + req.getName());
        }
        Category cat = Category.builder()
            .name(req.getName())
            .description(req.getDescription())
            .build();
        return toResponse(categoryRepository.save(cat));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category cat = getOrThrow(id);
        categoryRepository.findByNameIgnoreCase(req.getName())
            .filter(c -> !c.getId().equals(id))
            .ifPresent(c -> { throw new ConflictException("Category name already taken"); });
        cat.setName(req.getName());
        cat.setDescription(req.getDescription());
        return toResponse(categoryRepository.save(cat));
    }

    @Transactional
    public void delete(Long id) {
        Category cat = getOrThrow(id);
        if (!cat.getProducts().isEmpty()) {
            throw new BadRequestException("Cannot delete category with existing products");
        }
        categoryRepository.delete(cat);
    }

    private Category getOrThrow(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
            .id(c.getId()).name(c.getName()).description(c.getDescription()).build();
    }
}
