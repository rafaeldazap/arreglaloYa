package com.arreglaloya.repository;

import com.arreglaloya.model.Cotizacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CotizacionRepository extends JpaRepository<Cotizacion, Long> {
    List<Cotizacion> findBySolicitudIdSolicitud(Long idSolicitud);
    List<Cotizacion> findByTrabajadorIdPerfil(Long idPerfil);
}
