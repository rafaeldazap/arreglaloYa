package com.arreglaloya.dto.solicitud;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearSolicitudRequest {

    private Long idTrabajador; // Opcional (si se solicita directamente a uno)

    @NotNull(message = "La categoría es obligatoria")
    private Long idCategoria;

    @NotNull(message = "La zona es obligatoria")
    private Long idZona;

    @NotBlank(message = "La descripción del problema es obligatoria")
    private String descripcion;

    @NotBlank(message = "La dirección exacta es obligatoria")
    private String direccionExacta;

    private BigDecimal montoOfrecido;

    private List<String> fotosUrls;
}
