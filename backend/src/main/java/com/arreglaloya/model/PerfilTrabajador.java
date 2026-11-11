package com.arreglaloya.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "perfil_trabajador")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilTrabajador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_perfil")
    private Long idPerfil;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "ci_numero", nullable = false, unique = true, length = 20)
    private String ciNumero;

    @Column(name = "url_ci")
    private String urlCi;

    @Column(name = "url_antecedentes")
    private String urlAntecedentes;

    @Column(name = "url_experiencia")
    private String urlExperiencia;

    @Column(name = "margen_error_min", nullable = false)
    @Builder.Default
    private Integer margenErrorMin = 0;

    @Column(name = "qr_imagen_url")
    private String qrImagenUrl;

    @Column(name = "qr_vigencia_min")
    private Integer qrVigenciaMin;

    @Column(name = "promedio_semanal", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal promedioSemanal = BigDecimal.ZERO;

    @Column(name = "promedio_mensual", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal promedioMensual = BigDecimal.ZERO;

    @Column(name = "promedio_anual", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal promedioAnual = BigDecimal.ZERO;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "trabajador_categoria",
        joinColumns = @JoinColumn(name = "id_perfil"),
        inverseJoinColumns = @JoinColumn(name = "id_categoria")
    )
    @Builder.Default
    private Set<Categoria> categorias = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "trabajador_zona",
        joinColumns = @JoinColumn(name = "id_perfil"),
        inverseJoinColumns = @JoinColumn(name = "id_zona")
    )
    @Builder.Default
    private Set<Zona> zonas = new HashSet<>();
}
