package com.arreglaloya.dto.reclamo;

import com.arreglaloya.enums.EstadoResolucion;
import com.arreglaloya.enums.MotivoReclamo;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReclamoDTO {
    private Long idReclamo;
    private Long idSolicitud;
    private Long idDenunciante;
    private String nombreDenunciante;
    private Long idDenunciado;
    private String nombreDenunciado;
    private MotivoReclamo motivo;
    private String urlPruebas;
    private EstadoResolucion estadoResolucion;
    private Integer diasSuspension;
}
