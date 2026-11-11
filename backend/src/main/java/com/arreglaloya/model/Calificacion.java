package com.arreglaloya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "calificacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Calificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_calificacion")
    private Long idCalificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudServicio solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_evaluador", nullable = false)
    private Usuario evaluador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_evaluado", nullable = false)
    private Usuario evaluado;

    @Column(name = "puntaje", nullable = false)
    private Short puntaje;

    @Column(name = "comentario", columnDefinition = "TEXT")
    private String comentario;

    @Column(name = "es_interna", nullable = false)
    @Builder.Default
    private Boolean esInterna = false;

    @Column(name = "fecha", nullable = false, updatable = false)
    private OffsetDateTime fecha;

    @PrePersist
    public void prePersist() {
        if (fecha == null) {
            fecha = OffsetDateTime.now();
        }
    }
}
