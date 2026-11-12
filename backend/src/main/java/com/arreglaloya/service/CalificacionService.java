package com.arreglaloya.service;

import com.arreglaloya.dto.calificacion.CalificacionDTO;
import com.arreglaloya.dto.calificacion.CrearCalificacionRequest;
import com.arreglaloya.exception.ResourceNotFoundException;
import com.arreglaloya.model.Calificacion;
import com.arreglaloya.model.PerfilTrabajador;
import com.arreglaloya.model.SolicitudServicio;
import com.arreglaloya.model.Usuario;
import com.arreglaloya.repository.CalificacionRepository;
import com.arreglaloya.repository.PerfilTrabajadorRepository;
import com.arreglaloya.repository.SolicitudServicioRepository;
import com.arreglaloya.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final SolicitudServicioRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final PerfilTrabajadorRepository perfilTrabajadorRepository;

    @Transactional
    public CalificacionDTO calificar(CrearCalificacionRequest request, String correoEvaluador) {
        Usuario evaluador = usuarioRepository.findByCorreo(correoEvaluador)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluador no encontrado"));

        Usuario evaluado = usuarioRepository.findById(request.getIdEvaluado())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario evaluado no encontrado"));

        SolicitudServicio solicitud = solicitudRepository.findById(request.getIdSolicitud())
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada"));

        Calificacion calificacion = Calificacion.builder()
                .solicitud(solicitud)
                .evaluador(evaluador)
                .evaluado(evaluado)
                .puntaje(request.getPuntaje())
                .comentario(request.getComentario())
                .esInterna(Boolean.TRUE.equals(request.getEsInterna()))
                .build();

        calificacion = calificacionRepository.save(calificacion);

        // Recalcular promedio del trabajador si aplica
        perfilTrabajadorRepository.findByUsuarioIdUsuario(evaluado.getIdUsuario()).ifPresent(perfil -> {
            List<Calificacion> calificaciones = calificacionRepository.findByEvaluadoIdUsuarioOrderByFechaDesc(evaluado.getIdUsuario());
            if (!calificaciones.isEmpty()) {
                double avg = calificaciones.stream()
                        .mapToInt(Calificacion::getPuntaje)
                        .average()
                        .orElse(0.0);
                BigDecimal promedio = BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
                perfil.setPromedioSemanal(promedio);
                perfil.setPromedioMensual(promedio);
                perfil.setPromedioAnual(promedio);
                perfilTrabajadorRepository.save(perfil);
            }
        });

        return mapToDTO(calificacion);
    }

    @Transactional(readOnly = true)
    public List<CalificacionDTO> listarPorUsuario(Long idUsuario) {
        return calificacionRepository.findByEvaluadoIdUsuarioOrderByFechaDesc(idUsuario).stream()
                .map(this::mapToDTO)
                .toList();
    }

    private CalificacionDTO mapToDTO(Calificacion c) {
        return CalificacionDTO.builder()
                .idCalificacion(c.getIdCalificacion())
                .idSolicitud(c.getSolicitud().getIdSolicitud())
                .idEvaluador(c.getEvaluador().getIdUsuario())
                .nombreEvaluador(c.getEvaluador().getNombreCompleto())
                .idEvaluado(c.getEvaluado().getIdUsuario())
                .nombreEvaluado(c.getEvaluado().getNombreCompleto())
                .puntaje(c.getPuntaje())
                .comentario(c.getComentario())
                .esInterna(c.getEsInterna())
                .fecha(c.getFecha())
                .build();
    }
}
