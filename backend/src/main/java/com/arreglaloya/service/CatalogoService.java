package com.arreglaloya.service;

import com.arreglaloya.dto.catalogo.CategoriaDTO;
import com.arreglaloya.dto.catalogo.ZonaDTO;
import com.arreglaloya.repository.CategoriaRepository;
import com.arreglaloya.repository.ZonaRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogoService {

    private final CategoriaRepository categoriaRepository;
    private final ZonaRepository zonaRepository;
    private final ModelMapper modelMapper;

    @Transactional(readOnly = true)
    public List<CategoriaDTO> listarCategorias() {
        return categoriaRepository.findByActivaTrue().stream()
                .map(cat -> modelMapper.map(cat, CategoriaDTO.class))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ZonaDTO> listarZonas() {
        return zonaRepository.findByActivaTrue().stream()
                .map(zona -> modelMapper.map(zona, ZonaDTO.class))
                .toList();
    }
}
