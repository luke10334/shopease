package com.shopease.dto.response;

import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success("OK", data);
    }

    public static ApiResponse<Void> success(String message) {
        return ApiResponse.<Void>builder().success(true).message(message).build();
    }
}
