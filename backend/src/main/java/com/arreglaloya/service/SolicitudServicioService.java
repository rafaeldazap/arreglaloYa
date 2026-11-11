package com.arreglaloya.service;

import com.arreglaloya.dto.solicitud.CrearSolicitudRequest;
import com.arreglaloya.dto.solicitud.SolicitudDetalleDTO;
import com.arreglaloya.enums.EstadoSolicitud;
import com.arreglaloya.exception.ResourceNotFoundException;
import com.arreglaloya.model.*;
import com.arreglaloya.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SolicitudServicioService {

    private final SolicitudServicioRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final PerfilTrabajadorRepository perfilTrabajadorRepository;
    private final CategoriaRepository categoriaRepository;
    private final ZonaRepository zonaRepository;
    private final HistorialEstadoRepository historialEstadoRepository;

    @Transactional
    public SolicitudDetalleDTO crear(CrearSolicitudRequest request, String correoCliente) {
        Usuario cliente = usuarioRepository.findByCorreo(correoCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        Categoria categoria = categoriaRepository.findById(request.getIdCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));

        Zona zona = zonaRepository.findById(request.getIdZona())
                .orElseThrow(() -> new ResourceNotFoundException("Zona no encontrada"));

        PerfilTrabajador trabajador = null;
        if (request.getIdTrabajador() != null) {
            trabajador = perfilTrabajadorRepository.findById(request.getIdTrabajador())
                    .orElseThrow(() -> new ResourceNotFoundException("Trabajador no encontrado"));
        }

        SolicitudServicio solicitud = SolicitudServicio.builder()
                .cliente(cliente)
                .trabajador(trabajador)
                .categoria(categoria)
                .zona(zona)
                .descripcion(request.getDescripcion())
                .direccionExacta(request.getDireccionExacta())
                .montoOfrecido(request.getMontoOfrecido())
                .estado(EstadoSolicitud.PENDIENTE)
                .fotos(new ArrayList<>())
                .build();

        if (request.getFotosUrls() != null) {
            for (String url : request.getFotosUrls()) {
                FotoSolicitud foto = FotoSolicitud.builder()
                        .solicitud(solicitud)
                        .urlFoto(url)
                        .build();
                solicitud.getFotos().add(foto);
            }
        }

        solicitud = solicitudRepository.save(solicitud);

        // Registrar evento inicial en historial
        HistorialEstado historial = HistorialEstado.builder()
                .solicitud(solicitud)
                .usuario(cliente)
                .estadoAnterior(null)
                .estadoNuevo(EstadoSolicitud.PENDIENTE.name())
                .descripcion("Solicitud creada por el cliente")
                .build();
        historialEstadoRepository.save(historial);

        return mapToDTO(solicitud);
    }

    @Transactional(readOnly = true)
    public List<SolicitudDetalleDTO> listarPorCliente(String correoCliente) {
        Usuario cliente = usuarioRepository.findByCorreo(correoCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

        return solicitudRepository.findByClienteIdUsuarioOrderByFechaCreacionDesc(cliente.getIdUsuario()).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SolicitudDetalleDTO obtenerPorId(Long idSolicitud) {
        SolicitudServicio solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada con ID: " + idSolicitud));
        return mapToDTO(solicitud);
    }

    @Transactional
    public SolicitudDetalleDTO cambiarEstado(Long idSolicitud, EstadoSolicitud nuevoEstado, String motivo, String correoUsuario) {
        SolicitudServicio solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada con ID: " + idSolicitud));

        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario).orElse(null);
        String estadoAnterior = solicitud.getEstado().name();

        solicitud.setEstado(nuevoEstado);
        solicitud = solicitudRepository.save(solicitud);

        HistorialEstado historial = HistorialEstado.builder()
                .solicitud(solicitud)
                .usuario(usuario)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(nuevoEstado.name())
                .descripcion(motivo != null ? motivo : "Cambio de estado a " + nuevoEstado.name())
                .build();
        historialEstadoRepository.save(historial);

        return mapToDTO(solicitud);
    }

    private SolicitudDetalleDTO mapToDTO(SolicitudServicio s) {
        return SolicitudDetalleDTO.builder()
                .idSolicitud(s.getIdSolicitud())
                .idCliente(s.getCliente().getIdUsuario())
                .nombreCliente(s.getCliente().getNombreCompleto())
                .idTrabajador(s.getTrabajador() != null ? s.getTrabajador().getIdPerfil() : null)
                .nombreTrabajador(s.getTrabajador() != null ? s.getTrabajador().getUsuario().getNombreCompleto() : null)
                .idCategoria(s.getCategoria().getIdCategoria())
                .nombreCategoria(s.getCategoria().getNombre())
                .idZona(s.getZona().getIdZona())
                .nombreZona(s.getZona().getNombre())
                .descripcion(s.getDescripcion())
                .direccionExacta(s.getDireccionExacta())
                .montoOfrecido(s.getMontoOfrecido())
                .estado(s.getEstado())
                .fechaCreacion(s.getFechaCreacion())
                .fechaExpiracion(s.getFechaExpiracion())
                .fotos(s.getFotos().stream().map(FotoSolicitud::getUrlFoto).toList())
                .build();
    }
}
