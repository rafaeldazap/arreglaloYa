package com.arreglaloya.controller;

import com.arreglaloya.dto.calificacion.CalificacionDTO;
import com.arreglaloya.dto.calificacion.CrearCalificacionRequest;
import com.arreglaloya.service.CalificacionService;
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
@RequestMapping("/calificaciones")
@RequiredArgsConstructor
@Tag(name = "Calificaciones", description = "Reseñas, opiniones y puntajes de servicios realizados")
public class CalificacionController {

    private final CalificacionService calificacionService;

    @PostMapping
    @Operation(summary = "Calificar un servicio finalizado (de 1 a 5 estrellas con comentario)")
    public ResponseEntity<CalificacionDTO> calificar(
            @Valid @RequestBody CrearCalificacionRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(calificacionService.calificar(request, userDetails.getUsername()));
    }

    @GetMapping("/usuario/{idUsuario}")
    @Operation(summary = "Listar las calificaciones y opiniones de un usuario/trabajador")
    public ResponseEntity<List<CalificacionDTO>> listarPorUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(calificacionService.listarPorUsuario(idUsuario));
    }
}
