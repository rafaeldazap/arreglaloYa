package com.arreglaloya.service;

import com.arreglaloya.dto.cotizacion.CotizacionDTO;
import com.arreglaloya.dto.cotizacion.CrearCotizacionRequest;
import com.arreglaloya.enums.EstadoCotizacion;
import com.arreglaloya.enums.EstadoSolicitud;
import com.arreglaloya.exception.BusinessException;
import com.arreglaloya.exception.ResourceNotFoundException;
import com.arreglaloya.model.*;
import com.arreglaloya.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CotizacionService {

    private final CotizacionRepository cotizacionRepository;
    private final SolicitudServicioRepository solicitudRepository;
    private final PerfilTrabajadorRepository perfilTrabajadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistorialEstadoRepository historialEstadoRepository;

    @Transactional
    public CotizacionDTO crearCotizacion(CrearCotizacionRequest request, String correoTrabajador) {
        Usuario usuario = usuarioRepository.findByCorreo(correoTrabajador)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        PerfilTrabajador trabajador = perfilTrabajadorRepository.findByUsuarioIdUsuario(usuario.getIdUsuario())
                .orElseThrow(() -> new BusinessException("Solo los trabajadores registrados pueden cotizar"));

        SolicitudServicio solicitud = solicitudRepository.findById(request.getIdSolicitud())
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada"));

        Cotizacion cotizacion = Cotizacion.builder()
                .solicitud(solicitud)
                .trabajador(trabajador)
                .requiereVisita(Boolean.TRUE.equals(request.getRequiereVisita()))
                .costoVisita(request.getCostoVisita() != null ? request.getCostoVisita() : BigDecimal.ZERO)
                .montoTotalPropuesto(request.getMontoTotalPropuesto())
                .incluyeMateriales(Boolean.TRUE.equals(request.getIncluyeMateriales()))
                .esRecotizacion(Boolean.TRUE.equals(request.getEsRecotizacion()))
                .estadoAprobacion(EstadoCotizacion.PENDIENTE)
                .build();

        cotizacion = cotizacionRepository.save(cotizacion);
        return mapToDTO(cotizacion);
    }

    @Transactional(readOnly = true)
    public List<CotizacionDTO> listarPorSolicitud(Long idSolicitud) {
        return cotizacionRepository.findBySolicitudIdSolicitud(idSolicitud).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public CotizacionDTO responderCotizacion(Long idCotizacion, EstadoCotizacion nuevoEstado, String correoCliente) {
        Cotizacion cotizacion = cotizacionRepository.findById(idCotizacion)
                .orElseThrow(() -> new ResourceNotFoundException("Cotización no encontrada"));

        SolicitudServicio solicitud = cotizacion.getSolicitud();

        if (!solicitud.getCliente().getCorreo().equalsIgnoreCase(correoCliente)) {
            throw new BusinessException("Solo el cliente dueño de la solicitud puede aceptar o rechazar cotizaciones");
        }

        cotizacion.setEstadoAprobacion(nuevoEstado);
        cotizacion = cotizacionRepository.save(cotizacion);

        if (nuevoEstado == EstadoCotizacion.ACEPTADA) {
            String estadoAnterior = solicitud.getEstado().name();
            solicitud.setEstado(EstadoSolicitud.APROBADO);
            solicitud.setTrabajador(cotizacion.getTrabajador());
            solicitudRepository.save(solicitud);

            HistorialEstado historial = HistorialEstado.builder()
                    .solicitud(solicitud)
                    .usuario(solicitud.getCliente())
                    .estadoAnterior(estadoAnterior)
                    .estadoNuevo(EstadoSolicitud.APROBADO.name())
                    .descripcion("Cotización #" + cotizacion.getIdCotizacion() + " aceptada por el cliente")
                    .build();
            historialEstadoRepository.save(historial);
        }

        return mapToDTO(cotizacion);
    }

    private CotizacionDTO mapToDTO(Cotizacion c) {
        return CotizacionDTO.builder()
                .idCotizacion(c.getIdCotizacion())
                .idSolicitud(c.getSolicitud().getIdSolicitud())
                .idTrabajador(c.getTrabajador().getIdPerfil())
                .nombreTrabajador(c.getTrabajador().getUsuario().getNombreCompleto())
                .requiereVisita(c.getRequiereVisita())
                .costoVisita(c.getCostoVisita())
                .montoTotalPropuesto(c.getMontoTotalPropuesto())
                .incluyeMateriales(c.getIncluyeMateriales())
                .esRecotizacion(c.getEsRecotizacion())
                .estadoAprobacion(c.getEstadoAprobacion())
                .build();
    }
}
