package com.shopease.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PlaceOrderRequest {

    @NotBlank(message = "Shipping address is required")
    @Size(max = 500)
    private String shippingAddress;
}
