package com.arreglaloya.model;

import com.arreglaloya.enums.EstadoCotizacion;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "cotizacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cotizacion")
    private Long idCotizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudServicio solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_trabajador", nullable = false)
    private PerfilTrabajador trabajador;

    @Column(name = "requiere_visita", nullable = false)
    @Builder.Default
    private Boolean requiereVisita = false;

    @Column(name = "costo_visita", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal costoVisita = BigDecimal.ZERO;

    @Column(name = "monto_total_propuesto", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotalPropuesto;

    @Column(name = "incluye_materiales", nullable = false)
    @Builder.Default
    private Boolean incluyeMateriales = false;

    @Column(name = "es_recotizacion", nullable = false)
    @Builder.Default
    private Boolean esRecotizacion = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_aprobacion", nullable = false, length = 15)
    @Builder.Default
    private EstadoCotizacion estadoAprobacion = EstadoCotizacion.PENDIENTE;
}
