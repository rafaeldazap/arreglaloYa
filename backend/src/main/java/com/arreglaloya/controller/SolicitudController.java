package com.arreglaloya.controller;

import com.arreglaloya.dto.solicitud.CrearSolicitudRequest;
import com.arreglaloya.dto.solicitud.SolicitudDetalleDTO;
import com.arreglaloya.enums.EstadoSolicitud;
import com.arreglaloya.service.SolicitudServicioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/solicitudes")
@RequiredArgsConstructor
@Tag(name = "Solicitudes", description = "Gestión de pedidos de servicio")
public class SolicitudController {

    private final SolicitudServicioService solicitudService;

    @PostMapping
    @Operation(summary = "Crear nueva solicitud de servicio con fotos y presupuesto")
    public ResponseEntity<SolicitudDetalleDTO> crear(
            @Valid @RequestBody CrearSolicitudRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(solicitudService.crear(request, userDetails.getUsername()));
    }

    @GetMapping("/mis-pedidos")
    @Operation(summary = "Obtener el listado de pedidos del usuario autenticado")
    public ResponseEntity<List<SolicitudDetalleDTO>> listarMisPedidos(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(solicitudService.listarPorCliente(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener el detalle de una solicitud por ID")
    public ResponseEntity<SolicitudDetalleDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(solicitudService.obtenerPorId(id));
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Actualizar el estado de una solicitud (Aprobar, Cancelar, etc.)")
    public ResponseEntity<SolicitudDetalleDTO> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoSolicitud nuevoEstado,
            @RequestParam(required = false) String motivo,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(solicitudService.cambiarEstado(id, nuevoEstado, motivo, userDetails.getUsername()));
    }
}
