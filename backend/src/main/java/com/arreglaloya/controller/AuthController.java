package com.arreglaloya.controller;

import com.arreglaloya.dto.auth.LoginRequest;
import com.arreglaloya.dto.auth.LoginResponse;
import com.arreglaloya.dto.auth.RegistroClienteRequest;
import com.arreglaloya.dto.auth.RegistroTrabajadorRequest;
import com.arreglaloya.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints para inicio de sesión y registro")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión y obtener token JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/registro-cliente")
    @Operation(summary = "Registrar nuevo cliente")
    public ResponseEntity<LoginResponse> registrarCliente(@Valid @RequestBody RegistroClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrarCliente(request));
    }

    @PostMapping("/registro-trabajador")
    @Operation(summary = "Registrar nuevo trabajador (queda en revisión)")
    public ResponseEntity<LoginResponse> registrarTrabajador(@Valid @RequestBody RegistroTrabajadorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrarTrabajador(request));
    }
}
