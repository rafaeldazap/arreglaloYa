package com.arreglaloya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "horario_atencion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HorarioAtencion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_horario")
    private Long idHorario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_perfil", nullable = false)
    private PerfilTrabajador perfilTrabajador;

    @Column(name = "dia_semana", nullable = false)
    private Short diaSemana; // 1 (Lunes) a 7 (Domingo)

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;
}
