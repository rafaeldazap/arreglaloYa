package com.arreglaloya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "foto_solicitud")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FotoSolicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_foto")
    private Long idFoto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudServicio solicitud;

    @Column(name = "url_foto", nullable = false)
    private String urlFoto;

    @Column(name = "fecha_carga", nullable = false, updatable = false)
    private OffsetDateTime fechaCarga;

    @PrePersist
    public void prePersist() {
        if (fechaCarga == null) {
            fechaCarga = OffsetDateTime.now();
        }
    }
}
