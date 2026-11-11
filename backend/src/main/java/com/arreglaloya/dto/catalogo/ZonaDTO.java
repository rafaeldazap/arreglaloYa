package com.arreglaloya.dto.catalogo;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZonaDTO {
    private Long idZona;
    private String nombre;
    private Boolean activa;
}
