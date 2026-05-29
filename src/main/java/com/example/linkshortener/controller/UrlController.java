package com.example.linkshortener.controller;

import com.example.linkshortener.dto.ShortenRequest;
import com.example.linkshortener.dto.ShortenResponse;
import com.example.linkshortener.model.UrlMapping;
import com.example.linkshortener.service.UrlShortenerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/urls")
public class UrlController {

    private final UrlShortenerService service;

    public UrlController(UrlShortenerService service) {
        this.service = service;
    }

    @PostMapping("/shorten")
    public ResponseEntity<ShortenResponse> shorten(@Valid @RequestBody ShortenRequest request, HttpServletRequest servletRequest) {
        UrlMapping mapping = service.shortenUrl(request);
        String baseUrl = getBaseUrl();
        ShortenResponse response = mapToResponse(mapping, baseUrl);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/list")
    public ResponseEntity<List<ShortenResponse>> list(HttpServletRequest servletRequest) {
        String baseUrl = getBaseUrl();
        List<ShortenResponse> responses = service.getAllMappings().stream()
                .map(mapping -> mapToResponse(mapping, baseUrl))
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/analytics/{shortCode}")
    public ResponseEntity<ShortenResponse> getAnalytics(@PathVariable String shortCode, HttpServletRequest servletRequest) {
        UrlMapping mapping = service.getAnalytics(shortCode);
        String baseUrl = getBaseUrl();
        return ResponseEntity.ok(mapToResponse(mapping, baseUrl));
    }

    @DeleteMapping("/{shortCode}")
    public ResponseEntity<Void> delete(@PathVariable String shortCode) {
        service.deleteUrl(shortCode);
        return ResponseEntity.noContent().build();
    }

    private String getBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }

    private ShortenResponse mapToResponse(UrlMapping mapping, String baseUrl) {
        String shortUrl = baseUrl + "/" + mapping.getShortCode();
        return new ShortenResponse(
                mapping.getShortCode(),
                shortUrl,
                mapping.getLongUrl(),
                mapping.getCreatedAt(),
                mapping.getExpiresAt(),
                mapping.getClickCount()
        );
    }
}
