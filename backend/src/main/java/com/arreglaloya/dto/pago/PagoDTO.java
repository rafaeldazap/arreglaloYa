package com.arreglaloya.dto.pago;

import com.arreglaloya.enums.MedioPago;
import com.arreglaloya.enums.TipoPago;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoDTO {
    private Long idPago;
    private Long idSolicitud;
    private TipoPago tipo;
    private MedioPago medioPago;
    private BigDecimal monto;
    private String urlComprobante;
    private Boolean conformidadCliente;
    private Boolean confirmadoPorTrabajador;
    private Boolean liberadoAlTrabajador;
}
