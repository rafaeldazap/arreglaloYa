package com.arreglaloya.controller;

import com.arreglaloya.dto.trabajador.PerfilTrabajadorDTO;
import com.arreglaloya.service.TrabajadorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trabajadores")
@RequiredArgsConstructor
@Tag(name = "Trabajadores", description = "Búsqueda y consulta de perfiles de trabajadores")
public class TrabajadorController {

    private final TrabajadorService trabajadorService;

    @GetMapping
    @Operation(summary = "Buscar trabajadores filtrando por categoría y/o zona")
    public ResponseEntity<List<PerfilTrabajadorDTO>> buscar(
            @Parameter(description = "ID de la categoría/especialidad") @RequestParam(required = false) Long categoria,
            @Parameter(description = "ID de la zona") @RequestParam(required = false) Long zona
    ) {
        return ResponseEntity.ok(trabajadorService.buscar(categoria, zona));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener el detalle del perfil de un trabajador por ID")
    public ResponseEntity<PerfilTrabajadorDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(trabajadorService.obtenerPorId(id));
    }
}
