package com.arreglaloya.repository;

import com.arreglaloya.enums.EstadoSolicitud;
import com.arreglaloya.model.SolicitudServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitudServicioRepository extends JpaRepository<SolicitudServicio, Long> {
    List<SolicitudServicio> findByClienteIdUsuarioOrderByFechaCreacionDesc(Long idCliente);
    List<SolicitudServicio> findByTrabajadorIdPerfilOrderByFechaCreacionDesc(Long idPerfil);
    List<SolicitudServicio> findByEstado(EstadoSolicitud estado);
}
