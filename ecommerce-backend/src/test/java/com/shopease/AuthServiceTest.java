package com.shopease;

import com.shopease.dto.request.RegisterRequest;
import com.shopease.dto.response.AuthResponse;
import com.shopease.entity.*;
import com.shopease.exception.ConflictException;
import com.shopease.repository.*;
import com.shopease.security.*;
import com.shopease.service.AuthService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock CartRepository cartRepository;
    @Mock AuthenticationManager authManager;
    @Mock JwtUtil jwtUtil;

    @InjectMocks AuthService authService;

    PasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setup() {
        // inject real encoder via reflection shortcut
        org.springframework.test.util.ReflectionTestUtils.setField(
            authService, "passwordEncoder", encoder);
    }

    @Test
    void register_success() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("test@example.com");
        req.setPassword("Test@1234");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(cartRepository.save(any())).thenReturn(null);
        when(jwtUtil.generateToken(any())).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(req);

        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getAccessToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getRole()).isEqualTo("USER");
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("dup@example.com");
        req.setPassword("Test@1234");
        req.setName("Dup");

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("Email already registered");
    }
}
