package com.arreglaloya.dto.catalogo;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriaDTO {
    private Long idCategoria;
    private String nombre;
    private Boolean activa;
}
