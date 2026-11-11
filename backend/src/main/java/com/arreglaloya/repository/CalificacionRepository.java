package com.arreglaloya.repository;

import com.arreglaloya.model.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {
    List<Calificacion> findByEvaluadoIdUsuarioOrderByFechaDesc(Long idEvaluado);
}
