package com.arreglaloya.controller;

import com.arreglaloya.dto.pago.PagoDTO;
import com.arreglaloya.dto.pago.RegistrarPagoRequest;
import com.arreglaloya.service.PagoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pagos")
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Gestión de anticipos (25%) y saldos (75%) de servicios")
public class PagoController {

    private final PagoService pagoService;

    @PostMapping
    @Operation(summary = "Registrar un pago (Anticipo 25% o Saldo 75%)")
    public ResponseEntity<PagoDTO> registrarPago(@Valid @RequestBody RegistrarPagoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.registrarPago(request));
    }

    @GetMapping("/solicitud/{idSolicitud}")
    @Operation(summary = "Consultar el historial de pagos de una solicitud")
    public ResponseEntity<List<PagoDTO>> listarPorSolicitud(@PathVariable Long idSolicitud) {
        return ResponseEntity.ok(pagoService.listarPorSolicitud(idSolicitud));
    }

    @PatchMapping("/{id}/confirmar")
    @Operation(summary = "Confirmar recepción de pago por parte del trabajador")
    public ResponseEntity<PagoDTO> confirmarPago(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.confirmarPorTrabajador(id));
    }
}
