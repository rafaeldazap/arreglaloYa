package com.arreglaloya.repository;

import com.arreglaloya.model.FotoSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FotoSolicitudRepository extends JpaRepository<FotoSolicitud, Long> {
    List<FotoSolicitud> findBySolicitudIdSolicitud(Long idSolicitud);
}
