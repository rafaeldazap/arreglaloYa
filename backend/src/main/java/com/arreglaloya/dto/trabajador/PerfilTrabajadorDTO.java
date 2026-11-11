package com.arreglaloya.dto.trabajador;

import com.arreglaloya.dto.catalogo.CategoriaDTO;
import com.arreglaloya.dto.catalogo.ZonaDTO;
import lombok.*;

import java.math.BigDecimal;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilTrabajadorDTO {
    private Long idPerfil;
    private Long idUsuario;
    private String nombreCompleto;
    private String telefono;
    private String correo;
    private String ciNumero;
    private Integer margenErrorMin;
    private BigDecimal promedioSemanal;
    private BigDecimal promedioMensual;
    private BigDecimal promedioAnual;
    private Set<CategoriaDTO> categorias;
    private Set<ZonaDTO> zonas;
}
