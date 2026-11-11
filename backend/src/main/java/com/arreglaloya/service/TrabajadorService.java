package com.arreglaloya.service;

import com.arreglaloya.dto.catalogo.CategoriaDTO;
import com.arreglaloya.dto.catalogo.ZonaDTO;
import com.arreglaloya.dto.trabajador.PerfilTrabajadorDTO;
import com.arreglaloya.exception.ResourceNotFoundException;
import com.arreglaloya.model.PerfilTrabajador;
import com.arreglaloya.repository.PerfilTrabajadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrabajadorService {

    private final PerfilTrabajadorRepository perfilTrabajadorRepository;

    @Transactional(readOnly = true)
    public List<PerfilTrabajadorDTO> buscar(Long idCategoria, Long idZona) {
        return perfilTrabajadorRepository.buscarPorFiltros(idCategoria, idZona).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PerfilTrabajadorDTO obtenerPorId(Long idPerfil) {
        PerfilTrabajador perfil = perfilTrabajadorRepository.findById(idPerfil)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de trabajador no encontrado con ID: " + idPerfil));
        return mapToDTO(perfil);
    }

    private PerfilTrabajadorDTO mapToDTO(PerfilTrabajador perfil) {
        return PerfilTrabajadorDTO.builder()
                .idPerfil(perfil.getIdPerfil())
                .idUsuario(perfil.getUsuario().getIdUsuario())
                .nombreCompleto(perfil.getUsuario().getNombreCompleto())
                .telefono(perfil.getUsuario().getTelefono())
                .correo(perfil.getUsuario().getCorreo())
                .ciNumero(perfil.getCiNumero())
                .margenErrorMin(perfil.getMargenErrorMin())
                .promedioSemanal(perfil.getPromedioSemanal())
                .promedioMensual(perfil.getPromedioMensual())
                .promedioAnual(perfil.getPromedioAnual())
                .categorias(perfil.getCategorias().stream()
                        .map(c -> CategoriaDTO.builder()
                                .idCategoria(c.getIdCategoria())
                                .nombre(c.getNombre())
                                .activa(c.getActiva())
                                .build())
                        .collect(Collectors.toSet()))
                .zonas(perfil.getZonas().stream()
                        .map(z -> ZonaDTO.builder()
                                .idZona(z.getIdZona())
                                .nombre(z.getNombre())
                                .activa(z.getActiva())
                                .build())
                        .collect(Collectors.toSet()))
                .build();
    }
}
