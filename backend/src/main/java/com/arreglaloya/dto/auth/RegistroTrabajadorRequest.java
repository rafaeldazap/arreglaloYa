package com.arreglaloya.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroTrabajadorRequest {

    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombreCompleto;

    private String telefono;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    @NotBlank(message = "El número de CI es obligatorio")
    private String ciNumero;

    private String urlCi;
    private String urlAntecedentes;
    private String urlExperiencia;

    @NotEmpty(message = "Debe seleccionar al menos una especialidad / categoría")
    private Set<Long> categoriasIds;

    @NotEmpty(message = "Debe seleccionar al menos una zona de atención")
    private Set<Long> zonasIds;
}
