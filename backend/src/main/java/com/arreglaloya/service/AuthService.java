package com.arreglaloya.service;

import com.arreglaloya.dto.auth.LoginRequest;
import com.arreglaloya.dto.auth.LoginResponse;
import com.arreglaloya.dto.auth.RegistroClienteRequest;
import com.arreglaloya.dto.auth.RegistroTrabajadorRequest;
import com.arreglaloya.enums.EstadoCuenta;
import com.arreglaloya.enums.RolUsuario;
import com.arreglaloya.exception.BusinessException;
import com.arreglaloya.model.Categoria;
import com.arreglaloya.model.PerfilTrabajador;
import com.arreglaloya.model.Usuario;
import com.arreglaloya.model.Zona;
import com.arreglaloya.repository.CategoriaRepository;
import com.arreglaloya.repository.PerfilTrabajadorRepository;
import com.arreglaloya.repository.UsuarioRepository;
import com.arreglaloya.repository.ZonaRepository;
import com.arreglaloya.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PerfilTrabajadorRepository perfilTrabajadorRepository;
    private final CategoriaRepository categoriaRepository;
    private final ZonaRepository zonaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        if (usuario.getEstadoCuenta() == EstadoCuenta.SUSPENDIDO ||
            usuario.getEstadoCuenta() == EstadoCuenta.BLOQUEADO_PERMANENTE) {
            throw new BusinessException("La cuenta se encuentra inactiva o suspendida");
        }

        UserDetails userDetails = new User(
                usuario.getCorreo(),
                usuario.getPasswordHash(),
                Collections.emptyList()
        );

        String token = jwtService.generateToken(userDetails);

        return LoginResponse.builder()
                .token(token)
                .idUsuario(usuario.getIdUsuario())
                .nombreCompleto(usuario.getNombreCompleto())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol())
                .build();
    }

    @Transactional
    public LoginResponse registrarCliente(RegistroClienteRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("El correo ya se encuentra registrado");
        }

        Usuario usuario = Usuario.builder()
                .nombreCompleto(request.getNombreCompleto())
                .telefono(request.getTelefono())
                .correo(request.getCorreo())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .rol(RolUsuario.CLIENTE)
                .estadoCuenta(EstadoCuenta.ACTIVO)
                .build();

        usuario = usuarioRepository.save(usuario);

        UserDetails userDetails = new User(usuario.getCorreo(), usuario.getPasswordHash(), Collections.emptyList());
        String token = jwtService.generateToken(userDetails);

        return LoginResponse.builder()
                .token(token)
                .idUsuario(usuario.getIdUsuario())
                .nombreCompleto(usuario.getNombreCompleto())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol())
                .build();
    }

    @Transactional
    public LoginResponse registrarTrabajador(RegistroTrabajadorRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BusinessException("El correo ya se encuentra registrado");
        }

        if (perfilTrabajadorRepository.findByCiNumero(request.getCiNumero()).isPresent()) {
            throw new BusinessException("El número de CI ya se encuentra registrado");
        }

        List<Categoria> categorias = categoriaRepository.findAllById(request.getCategoriasIds());
        List<Zona> zonas = zonaRepository.findAllById(request.getZonasIds());

        // El trabajador queda en estado REVISION por política del sistema
        Usuario usuario = Usuario.builder()
                .nombreCompleto(request.getNombreCompleto())
                .telefono(request.getTelefono())
                .correo(request.getCorreo())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .rol(RolUsuario.TRABAJADOR)
                .estadoCuenta(EstadoCuenta.REVISION)
                .build();

        usuario = usuarioRepository.save(usuario);

        PerfilTrabajador perfil = PerfilTrabajador.builder()
                .usuario(usuario)
                .ciNumero(request.getCiNumero())
                .urlCi(request.getUrlCi())
                .urlAntecedentes(request.getUrlAntecedentes())
                .urlExperiencia(request.getUrlExperiencia())
                .categorias(new HashSet<>(categorias))
                .zonas(new HashSet<>(zonas))
                .build();

        perfilTrabajadorRepository.save(perfil);

        UserDetails userDetails = new User(usuario.getCorreo(), usuario.getPasswordHash(), Collections.emptyList());
        String token = jwtService.generateToken(userDetails);

        return LoginResponse.builder()
                .token(token)
                .idUsuario(usuario.getIdUsuario())
                .nombreCompleto(usuario.getNombreCompleto())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol())
                .build();
    }
}
