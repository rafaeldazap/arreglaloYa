package com.arreglaloya.repository;

import com.arreglaloya.model.HistorialEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialEstadoRepository extends JpaRepository<HistorialEstado, Long> {
    List<HistorialEstado> findBySolicitudIdSolicitudOrderByFechaHoraDesc(Long idSolicitud);
}
