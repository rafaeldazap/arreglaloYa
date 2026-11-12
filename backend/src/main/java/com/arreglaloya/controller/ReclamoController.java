package com.arreglaloya.controller;

import com.arreglaloya.dto.reclamo.CrearReclamoRequest;
import com.arreglaloya.dto.reclamo.ReclamoDTO;
import com.arreglaloya.enums.EstadoResolucion;
import com.arreglaloya.service.ReclamoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reclamos")
@RequiredArgsConstructor
@Tag(name = "Reclamos y Sanciones", description = "Gestión de disputas, denuncias y suspensiones")
public class ReclamoController {

    private final ReclamoService reclamoService;

    @PostMapping
    @Operation(summary = "Presentar un reclamo formal sobre una solicitud")
    public ResponseEntity<ReclamoDTO> registrarReclamo(
            @Valid @RequestBody CrearReclamoRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reclamoService.registrarReclamo(request, userDetails.getUsername()));
    }

    @GetMapping("/solicitud/{idSolicitud}")
    @Operation(summary = "Consultar el reclamo asociado a una solicitud")
    public ResponseEntity<ReclamoDTO> obtenerPorSolicitud(@PathVariable Long idSolicitud) {
        return ResponseEntity.ok(reclamoService.obtenerPorSolicitud(idSolicitud));
    }

    @PatchMapping("/{id}/resolver")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resolver un reclamo y aplicar días de suspensión (Solo ADMIN)")
    public ResponseEntity<ReclamoDTO> resolverReclamo(
            @PathVariable Long id,
            @RequestParam EstadoResolucion resolucion,
            @RequestParam(defaultValue = "0") int diasSuspension
    ) {
        return ResponseEntity.ok(reclamoService.resolverReclamo(id, resolucion, diasSuspension));
    }
}
