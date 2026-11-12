package com.arreglaloya.repository;

import com.arreglaloya.model.ReclamoSancion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReclamoSancionRepository extends JpaRepository<ReclamoSancion, Long> {
    Optional<ReclamoSancion> findBySolicitudIdSolicitud(Long idSolicitud);
}
