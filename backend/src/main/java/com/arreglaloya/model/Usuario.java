package com.arreglaloya.model;

import com.arreglaloya.enums.EstadoCuenta;
import com.arreglaloya.enums.RolUsuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "nombre_completo", nullable = false, length = 120)
    private String nombreCompleto;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "correo", nullable = false, unique = true, length = 120)
    private String correo;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 15)
    private RolUsuario rol;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_cuenta", nullable = false, length = 25)
    @Builder.Default
    private EstadoCuenta estadoCuenta = EstadoCuenta.ACTIVO;

    @Column(name = "nivel_fibonacci", nullable = false)
    @Builder.Default
    private Integer nivelFibonacci = 0;

    @Column(name = "suspendido_hasta")
    private OffsetDateTime suspendidoHasta;

    @OneToOne(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PerfilTrabajador perfilTrabajador;
}
