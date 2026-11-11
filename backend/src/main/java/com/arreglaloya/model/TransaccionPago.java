package com.arreglaloya.model;

import com.arreglaloya.enums.MedioPago;
import com.arreglaloya.enums.TipoPago;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "transaccion_pago")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransaccionPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Long idPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudServicio solicitud;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 15)
    private TipoPago tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "medio_pago", nullable = false, length = 20)
    private MedioPago medioPago;

    @Column(name = "monto", nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "url_comprobante")
    private String urlComprobante;

    @Column(name = "conformidad_cliente", nullable = false)
    @Builder.Default
    private Boolean conformidadCliente = false;

    @Column(name = "confirmado_por_trabajador", nullable = false)
    @Builder.Default
    private Boolean confirmadoPorTrabajador = false;

    @Column(name = "liberado_al_trabajador", nullable = false)
    @Builder.Default
    private Boolean liberadoAlTrabajador = false;
}
