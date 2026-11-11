package com.arreglaloya.dto.auth;

import com.arreglaloya.enums.RolUsuario;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    private Long idUsuario;
    private String nombreCompleto;
    private String correo;
    private RolUsuario rol;
}
