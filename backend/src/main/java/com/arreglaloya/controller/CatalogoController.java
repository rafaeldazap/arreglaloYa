package com.arreglaloya.controller;

import com.arreglaloya.dto.catalogo.CategoriaDTO;
import com.arreglaloya.dto.catalogo.ZonaDTO;
import com.arreglaloya.service.CatalogoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Catálogos", description = "Endpoints públicos para categorías y zonas")
public class CatalogoController {

    private final CatalogoService catalogoService;

    @GetMapping("/categorias")
    @Operation(summary = "Listar todas las especialidades/categorías activas")
    public ResponseEntity<List<CategoriaDTO>> listarCategorias() {
        return ResponseEntity.ok(catalogoService.listarCategorias());
    }

    @GetMapping("/zonas")
    @Operation(summary = "Listar todas las zonas activas de Cochabamba")
    public ResponseEntity<List<ZonaDTO>> listarZonas() {
        return ResponseEntity.ok(catalogoService.listarZonas());
    }
}
