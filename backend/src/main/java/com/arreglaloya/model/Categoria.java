package com.arreglaloya.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Long idCategoria;

    @Column(name = "nombre", nullable = false, unique = true, length = 60)
    private String nombre;

    @Column(name = "activa", nullable = false)
    @Builder.Default
    private Boolean activa = true;
}
