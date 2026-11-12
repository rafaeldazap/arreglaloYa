package com.arreglaloya.controller;

import com.arreglaloya.dto.cotizacion.CotizacionDTO;
import com.arreglaloya.dto.cotizacion.CrearCotizacionRequest;
import com.arreglaloya.enums.EstadoCotizacion;
import com.arreglaloya.service.CotizacionService;
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
@RequestMapping("/cotizaciones")
@RequiredArgsConstructor
@Tag(name = "Cotizaciones", description = "Propuestas de costo y recotizaciones para solicitudes")
public class CotizacionController {

    private final CotizacionService cotizacionService;

    @PostMapping
    @Operation(summary = "Crear o enviar cotización para una solicitud (solo trabajadores)")
    public ResponseEntity<CotizacionDTO> crear(
            @Valid @RequestBody CrearCotizacionRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cotizacionService.crearCotizacion(request, userDetails.getUsername()));
    }

    @GetMapping("/solicitud/{idSolicitud}")
    @Operation(summary = "Listar todas las cotizaciones recibidas para una solicitud")
    public ResponseEntity<List<CotizacionDTO>> listarPorSolicitud(@PathVariable Long idSolicitud) {
        return ResponseEntity.ok(cotizacionService.listarPorSolicitud(idSolicitud));
    }

    @PatchMapping("/{id}/responder")
    @Operation(summary = "Aceptar o rechazar una cotización (solo cliente dueño de la solicitud)")
    public ResponseEntity<CotizacionDTO> responder(
            @PathVariable Long id,
            @RequestParam EstadoCotizacion estado,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(cotizacionService.responderCotizacion(id, estado, userDetails.getUsername()));
    }
}
