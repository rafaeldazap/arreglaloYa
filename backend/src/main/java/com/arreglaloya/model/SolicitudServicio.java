package com.arreglaloya.model;

import com.arreglaloya.enums.EstadoSolicitud;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "solicitud_servicio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud")
    private Long idSolicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_trabajador")
    private PerfilTrabajador trabajador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona", nullable = false)
    private Zona zona;

    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "direccion_exacta", nullable = false)
    private String direccionExacta;

    @Column(name = "monto_ofrecido", precision = 10, scale = 2)
    private BigDecimal montoOfrecido;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 25)
    @Builder.Default
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private OffsetDateTime fechaCreacion;

    @Column(name = "fecha_expiracion")
    private OffsetDateTime fechaExpiracion;

    @Column(name = "fecha_inicio_agendada")
    private OffsetDateTime fechaInicioAgendada;

    @Column(name = "fecha_fin_estimada")
    private OffsetDateTime fechaFinEstimada;

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FotoSolicitud> fotos = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (fechaCreacion == null) {
            fechaCreacion = OffsetDateTime.now();
        }
        if (fechaExpiracion == null) {
            fechaExpiracion = fechaCreacion.plusDays(30);
        }
        if (estado == null) {
            estado = EstadoSolicitud.PENDIENTE;
        }
    }
}
