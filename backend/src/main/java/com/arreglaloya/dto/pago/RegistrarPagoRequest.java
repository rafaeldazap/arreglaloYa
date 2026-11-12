package com.arreglaloya.dto.pago;

import com.arreglaloya.enums.MedioPago;
import com.arreglaloya.enums.TipoPago;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrarPagoRequest {

    @NotNull(message = "El ID de la solicitud es obligatorio")
    private Long idSolicitud;

    @NotNull(message = "El tipo de pago es obligatorio (ANTICIPO_25 o SALDO_75)")
    private TipoPago tipo;

    @NotNull(message = "El medio de pago es obligatorio")
    private MedioPago medioPago;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal monto;

    private String urlComprobante;
}
