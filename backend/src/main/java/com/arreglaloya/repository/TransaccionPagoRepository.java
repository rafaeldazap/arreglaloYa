package com.arreglaloya.repository;

import com.arreglaloya.model.TransaccionPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransaccionPagoRepository extends JpaRepository<TransaccionPago, Long> {
    List<TransaccionPago> findBySolicitudIdSolicitud(Long idSolicitud);
}
