package com.arreglaloya.dto.solicitud;

import com.arreglaloya.enums.EstadoSolicitud;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudDetalleDTO {
    private Long idSolicitud;
    private Long idCliente;
    private String nombreCliente;
    private Long idTrabajador;
    private String nombreTrabajador;
    private Long idCategoria;
    private String nombreCategoria;
    private Long idZona;
    private String nombreZona;
    private String descripcion;
    private String direccionExacta;
    private BigDecimal montoOfrecido;
    private EstadoSolicitud estado;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaExpiracion;
    private List<String> fotos;
}
