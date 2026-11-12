package com.arreglaloya.service;

import com.arreglaloya.dto.reclamo.CrearReclamoRequest;
import com.arreglaloya.dto.reclamo.ReclamoDTO;
import com.arreglaloya.enums.EstadoCuenta;
import com.arreglaloya.enums.EstadoResolucion;
import com.arreglaloya.exception.BusinessException;
import com.arreglaloya.exception.ResourceNotFoundException;
import com.arreglaloya.model.ReclamoSancion;
import com.arreglaloya.model.SolicitudServicio;
import com.arreglaloya.model.Usuario;
import com.arreglaloya.repository.ReclamoSancionRepository;
import com.arreglaloya.repository.SolicitudServicioRepository;
import com.arreglaloya.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class ReclamoService {

    private final ReclamoSancionRepository reclamoRepository;
    private final SolicitudServicioRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public ReclamoDTO registrarReclamo(CrearReclamoRequest request, String correoDenunciante) {
        if (reclamoRepository.findBySolicitudIdSolicitud(request.getIdSolicitud()).isPresent()) {
            throw new BusinessException("Esta solicitud ya cuenta con un reclamo registrado");
        }

        Usuario denunciante = usuarioRepository.findByCorreo(correoDenunciante)
                .orElseThrow(() -> new ResourceNotFoundException("Denunciante no encontrado"));

        Usuario denunciado = usuarioRepository.findById(request.getIdDenunciado())
                .orElseThrow(() -> new ResourceNotFoundException("Denunciado no encontrado"));

        SolicitudServicio solicitud = solicitudRepository.findById(request.getIdSolicitud())
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada"));

        ReclamoSancion reclamo = ReclamoSancion.builder()
                .solicitud(solicitud)
                .denunciante(denunciante)
                .denunciado(denunciado)
                .motivo(request.getMotivo())
                .urlPruebas(request.getUrlPruebas())
                .estadoResolucion(EstadoResolucion.EN_REVISION)
                .diasSuspension(0)
                .build();

        reclamo = reclamoRepository.save(reclamo);
        return mapToDTO(reclamo);
    }

    @Transactional(readOnly = true)
    public ReclamoDTO obtenerPorSolicitud(Long idSolicitud) {
        ReclamoSancion reclamo = reclamoRepository.findBySolicitudIdSolicitud(idSolicitud)
                .orElseThrow(() -> new ResourceNotFoundException("No existe reclamo para la solicitud: " + idSolicitud));
        return mapToDTO(reclamo);
    }

    @Transactional
    public ReclamoDTO resolverReclamo(Long idReclamo, EstadoResolucion resolucion, int diasSuspension) {
        ReclamoSancion reclamo = reclamoRepository.findById(idReclamo)
                .orElseThrow(() -> new ResourceNotFoundException("Reclamo no encontrado"));

        reclamo.setEstadoResolucion(resolucion);
        reclamo.setDiasSuspension(diasSuspension);

        if (resolucion == EstadoResolucion.PROCEDENTE && diasSuspension > 0) {
            Usuario denunciado = reclamo.getDenunciado();
            denunciado.setEstadoCuenta(EstadoCuenta.SUSPENDIDO);
            denunciado.setSuspendidoHasta(OffsetDateTime.now().plusDays(diasSuspension));
            usuarioRepository.save(denunciado);
        }

        reclamo = reclamoRepository.save(reclamo);
        return mapToDTO(reclamo);
    }

    private ReclamoDTO mapToDTO(ReclamoSancion r) {
        return ReclamoDTO.builder()
                .idReclamo(r.getIdReclamo())
                .idSolicitud(r.getSolicitud().getIdSolicitud())
                .idDenunciante(r.getDenunciante().getIdUsuario())
                .nombreDenunciante(r.getDenunciante().getNombreCompleto())
                .idDenunciado(r.getDenunciado().getIdUsuario())
                .nombreDenunciado(r.getDenunciado().getNombreCompleto())
                .motivo(r.getMotivo())
                .urlPruebas(r.getUrlPruebas())
                .estadoResolucion(r.getEstadoResolucion())
                .diasSuspension(r.getDiasSuspension())
                .build();
    }
}
