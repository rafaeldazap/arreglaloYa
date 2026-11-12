package com.arreglaloya.dto.calificacion;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalificacionDTO {
    private Long idCalificacion;
    private Long idSolicitud;
    private Long idEvaluador;
    private String nombreEvaluador;
    private Long idEvaluado;
    private String nombreEvaluado;
    private Short puntaje;
    private String comentario;
    private Boolean esInterna;
    private OffsetDateTime fecha;
}
