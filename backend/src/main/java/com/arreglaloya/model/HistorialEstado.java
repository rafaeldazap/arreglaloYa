package com.arreglaloya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "historial_estado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evento")
    private Long idEvento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudServicio solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "estado_anterior", length = 25)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", nullable = false, length = 25)
    private String estadoNuevo;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "fecha_hora", nullable = false, updatable = false)
    private OffsetDateTime fechaHora;

    @PrePersist
    public void prePersist() {
        if (fechaHora == null) {
            fechaHora = OffsetDateTime.now();
        }
    }
}
