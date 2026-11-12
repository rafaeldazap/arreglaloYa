package com.arreglaloya.dto.reclamo;

import com.arreglaloya.enums.MotivoReclamo;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearReclamoRequest {

    @NotNull(message = "El ID de la solicitud es obligatorio")
    private Long idSolicitud;

    @NotNull(message = "El ID del denunciado es obligatorio")
    private Long idDenunciado;

    @NotNull(message = "El motivo del reclamo es obligatorio")
    private MotivoReclamo motivo;

    private String urlPruebas;
}
