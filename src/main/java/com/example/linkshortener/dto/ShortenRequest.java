package com.example.linkshortener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ShortenRequest(
    @NotBlank(message = "URL cannot be blank")
    @Pattern(regexp = "^https?://.+", message = "URL must start with http:// or https://")
    String longUrl,
    
    String customAlias,
    
    Long ttlSeconds
) {}
