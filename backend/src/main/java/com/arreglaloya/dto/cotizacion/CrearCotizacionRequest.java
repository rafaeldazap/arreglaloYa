package com.arreglaloya.dto.cotizacion;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearCotizacionRequest {

    @NotNull(message = "El ID de la solicitud es obligatorio")
    private Long idSolicitud;

    private Boolean requiereVisita;

    private BigDecimal costoVisita;

    @NotNull(message = "El monto total propuesto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto propuesto debe ser mayor a 0")
    private BigDecimal montoTotalPropuesto;

    private Boolean incluyeMateriales;

    private Boolean esRecotizacion;
}
