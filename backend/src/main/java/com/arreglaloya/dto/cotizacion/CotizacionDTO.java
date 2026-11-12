package com.arreglaloya.dto.cotizacion;

import com.arreglaloya.enums.EstadoCotizacion;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizacionDTO {
    private Long idCotizacion;
    private Long idSolicitud;
    private Long idTrabajador;
    private String nombreTrabajador;
    private Boolean requiereVisita;
    private BigDecimal costoVisita;
    private BigDecimal montoTotalPropuesto;
    private Boolean incluyeMateriales;
    private Boolean esRecotizacion;
    private EstadoCotizacion estadoAprobacion;
}
