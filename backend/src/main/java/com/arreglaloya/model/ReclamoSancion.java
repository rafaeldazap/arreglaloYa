package com.arreglaloya.model;

import com.arreglaloya.enums.EstadoResolucion;
import com.arreglaloya.enums.MotivoReclamo;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reclamo_sancion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReclamoSancion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reclamo")
    private Long idReclamo;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false, unique = true)
    private SolicitudServicio solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_denunciante", nullable = false)
    private Usuario denunciante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_denunciado", nullable = false)
    private Usuario denunciado;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo", nullable = false, length = 25)
    private MotivoReclamo motivo;

    @Column(name = "url_pruebas")
    private String urlPruebas;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_resolucion", nullable = false, length = 15)
    @Builder.Default
    private EstadoResolucion estadoResolucion = EstadoResolucion.EN_REVISION;

    @Column(name = "dias_suspension", nullable = false)
    @Builder.Default
    private Integer diasSuspension = 0;
}
