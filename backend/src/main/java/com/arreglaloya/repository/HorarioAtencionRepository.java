package com.arreglaloya.repository;

import com.arreglaloya.model.HorarioAtencion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HorarioAtencionRepository extends JpaRepository<HorarioAtencion, Long> {
    List<HorarioAtencion> findByPerfilTrabajadorIdPerfil(Long idPerfil);
}
