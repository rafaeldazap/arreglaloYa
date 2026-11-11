package com.arreglaloya.repository;

import com.arreglaloya.model.PerfilTrabajador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerfilTrabajadorRepository extends JpaRepository<PerfilTrabajador, Long> {

    Optional<PerfilTrabajador> findByUsuarioIdUsuario(Long idUsuario);

    Optional<PerfilTrabajador> findByCiNumero(String ciNumero);

    @Query("""
        SELECT DISTINCT p FROM PerfilTrabajador p
        LEFT JOIN p.categorias c
        LEFT JOIN p.zonas z
        WHERE (:idCategoria IS NULL OR c.idCategoria = :idCategoria)
          AND (:idZona IS NULL OR z.idZona = :idZona)
          AND p.usuario.estadoCuenta = com.arreglaloya.enums.EstadoCuenta.ACTIVO
    """)
    List<PerfilTrabajador> buscarPorFiltros(
        @Param("idCategoria") Long idCategoria,
        @Param("idZona") Long idZona
    );
}
