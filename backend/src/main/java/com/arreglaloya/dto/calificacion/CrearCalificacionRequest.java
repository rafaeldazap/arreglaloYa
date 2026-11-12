package com.arreglaloya.dto.calificacion;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearCalificacionRequest {

    @NotNull(message = "El ID de la solicitud es obligatorio")
    private Long idSolicitud;

    @NotNull(message = "El ID del usuario evaluado es obligatorio")
    private Long idEvaluado;

    @NotNull(message = "El puntaje es obligatorio")
    @Min(value = 1, message = "El puntaje mínimo es 1")
    @Max(value = 5, message = "El puntaje máximo es 5")
    private Short puntaje;

    private String comentario;

    private Boolean esInterna;
}
