package com.shopease.service;

import com.shopease.dto.request.*;
import com.shopease.dto.response.*;
import com.shopease.entity.*;
import com.shopease.exception.ConflictException;
import com.shopease.repository.*;
import com.shopease.security.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email already registered: " + req.getEmail());
        }

        User user = User.builder()
            .name(req.getName())
            .email(req.getEmail().toLowerCase())
            .password(passwordEncoder.encode(req.getPassword()))
            .role(Role.USER)
            .build();
        userRepository.save(user);

        // Create empty cart for user
        Cart cart = Cart.builder().user(user).build();
        cartRepository.save(cart);

        log.info("Registered new user: {}", user.getEmail());
        return buildAuthResponse(UserPrincipal.from(user), user);
    }

    public AuthResponse login(LoginRequest req) {
        var auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail().toLowerCase(), req.getPassword())
        );
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = userRepository.findByEmail(principal.getEmail()).orElseThrow();
        return buildAuthResponse(principal, user);
    }

    private AuthResponse buildAuthResponse(UserPrincipal principal, User user) {
        String token = jwtUtil.generateToken(principal);
        return AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().name())
            .build();
    }
}
