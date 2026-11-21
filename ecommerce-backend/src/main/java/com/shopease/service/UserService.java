package com.shopease.service;

import com.shopease.dto.response.*;
import com.shopease.entity.User;
import com.shopease.exception.ResourceNotFoundException;
import com.shopease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        return toResponse(getOrThrow(userId));
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> findAll(int page, int size) {
        Page<User> result = userRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return PagedResponse.<UserResponse>builder()
            .content(result.getContent().stream().map(this::toResponse).toList())
            .page(result.getNumber())
            .size(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .last(result.isLast())
            .build();
    }

    private User getOrThrow(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
            .id(u.getId())
            .name(u.getName())
            .email(u.getEmail())
            .role(u.getRole().name())
            .createdAt(u.getCreatedAt())
            .build();
    }
}
