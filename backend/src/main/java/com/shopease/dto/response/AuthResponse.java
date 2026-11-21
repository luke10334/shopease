package com.shopease.dto.response;

import lombok.*;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private String email;
    private String name;
    private String role;
}
