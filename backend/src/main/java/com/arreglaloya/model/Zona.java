package com.arreglaloya.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "zona")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Zona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_zona")
    private Long idZona;

    @Column(name = "nombre", nullable = false, unique = true, length = 80)
    private String nombre;

    @Column(name = "activa", nullable = false)
    @Builder.Default
    private Boolean activa = true;
}
