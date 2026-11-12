package com.arreglaloya.service;

import com.arreglaloya.dto.pago.PagoDTO;
import com.arreglaloya.dto.pago.RegistrarPagoRequest;
import com.arreglaloya.enums.EstadoSolicitud;
import com.arreglaloya.enums.TipoPago;
import com.arreglaloya.exception.ResourceNotFoundException;
import com.arreglaloya.model.HistorialEstado;
import com.arreglaloya.model.SolicitudServicio;
import com.arreglaloya.model.TransaccionPago;
import com.arreglaloya.repository.HistorialEstadoRepository;
import com.arreglaloya.repository.SolicitudServicioRepository;
import com.arreglaloya.repository.TransaccionPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final TransaccionPagoRepository transaccionPagoRepository;
    private final SolicitudServicioRepository solicitudRepository;
    private final HistorialEstadoRepository historialEstadoRepository;

    @Transactional
    public PagoDTO registrarPago(RegistrarPagoRequest request) {
        SolicitudServicio solicitud = solicitudRepository.findById(request.getIdSolicitud())
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada"));

        TransaccionPago pago = TransaccionPago.builder()
                .solicitud(solicitud)
                .tipo(request.getTipo())
                .medioPago(request.getMedioPago())
                .monto(request.getMonto())
                .urlComprobante(request.getUrlComprobante())
                .conformidadCliente(true)
                .confirmadoPorTrabajador(false)
                .liberadoAlTrabajador(false)
                .build();

        pago = transaccionPagoRepository.save(pago);

        // Si es anticipo del 25%, el servicio pasa a EN_PROCESO
        if (request.getTipo() == TipoPago.ANTICIPO_25 && solicitud.getEstado() == EstadoSolicitud.APROBADO) {
            solicitud.setEstado(EstadoSolicitud.EN_PROCESO);
            solicitudRepository.save(solicitud);

            HistorialEstado historial = HistorialEstado.builder()
                    .solicitud(solicitud)
                    .usuario(solicitud.getCliente())
                    .estadoAnterior(EstadoSolicitud.APROBADO.name())
                    .estadoNuevo(EstadoSolicitud.EN_PROCESO.name())
                    .descripcion("Anticipo de 25% registrado. Servicio en proceso.")
                    .build();
            historialEstadoRepository.save(historial);
        }

        return mapToDTO(pago);
    }

    @Transactional(readOnly = true)
    public List<PagoDTO> listarPorSolicitud(Long idSolicitud) {
        return transaccionPagoRepository.findBySolicitudIdSolicitud(idSolicitud).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public PagoDTO confirmarPorTrabajador(Long idPago) {
        TransaccionPago pago = transaccionPagoRepository.findById(idPago)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));

        pago.setConfirmadoPorTrabajador(true);
        pago.setLiberadoAlTrabajador(true);
        pago = transaccionPagoRepository.save(pago);

        // Si se confirma el saldo del 75%, el servicio pasa a FINALIZADO
        if (pago.getTipo() == TipoPago.SALDO_75) {
            SolicitudServicio solicitud = pago.getSolicitud();
            solicitud.setEstado(EstadoSolicitud.FINALIZADO);
            solicitudRepository.save(solicitud);

            HistorialEstado historial = HistorialEstado.builder()
                    .solicitud(solicitud)
                    .estadoAnterior(EstadoSolicitud.EN_PROCESO.name())
                    .estadoNuevo(EstadoSolicitud.FINALIZADO.name())
                    .descripcion("Saldo del 75% confirmado. Servicio finalizado.")
                    .build();
            historialEstadoRepository.save(historial);
        }

        return mapToDTO(pago);
    }

    private PagoDTO mapToDTO(TransaccionPago p) {
        return PagoDTO.builder()
                .idPago(p.getIdPago())
                .idSolicitud(p.getSolicitud().getIdSolicitud())
                .tipo(p.getTipo())
                .medioPago(p.getMedioPago())
                .monto(p.getMonto())
                .urlComprobante(p.getUrlComprobante())
                .conformidadCliente(p.getConformidadCliente())
                .confirmadoPorTrabajador(p.getConfirmadoPorTrabajador())
                .liberadoAlTrabajador(p.getLiberadoAlTrabajador())
                .build();
    }
}
