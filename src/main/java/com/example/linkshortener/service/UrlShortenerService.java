package com.example.linkshortener.service;

import com.example.linkshortener.dto.ShortenRequest;
import com.example.linkshortener.exception.AliasAlreadyExistsException;
import com.example.linkshortener.exception.UrlExpiredException;
import com.example.linkshortener.exception.UrlNotFoundException;
import com.example.linkshortener.exception.UrlShortenerException;
import com.example.linkshortener.model.UrlMapping;
import com.example.linkshortener.repository.UrlMappingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UrlShortenerService {

    private final UrlMappingRepository repository;
    private static final String CHAR_POOL = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    public UrlShortenerService(UrlMappingRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public UrlMapping shortenUrl(ShortenRequest request) {
        String shortCode;

        if (request.customAlias() != null && !request.customAlias().trim().isEmpty()) {
            shortCode = request.customAlias().trim();
            // Validate custom alias format (alphanumeric and hyphens/underscores only, between 3 and 30 chars)
            if (!shortCode.matches("^[a-zA-Z0-9-_]{3,30}$")) {
                throw new UrlShortenerException("Custom alias must be alphanumeric, between 3 and 30 characters, and can only include '-' or '_'");
            }
            if (repository.existsByShortCode(shortCode)) {
                throw new AliasAlreadyExistsException("Custom alias '" + shortCode + "' is already in use");
            }
        } else {
            shortCode = generateUniqueShortCode();
        }

        LocalDateTime expiresAt = null;
        if (request.ttlSeconds() != null && request.ttlSeconds() > 0) {
            expiresAt = LocalDateTime.now().plusSeconds(request.ttlSeconds());
        }

        UrlMapping mapping = new UrlMapping(shortCode, request.longUrl(), LocalDateTime.now(), expiresAt);
        return repository.save(mapping);
    }

    @Transactional
    public UrlMapping resolveAndTrack(String shortCode) {
        UrlMapping mapping = repository.findByShortCode(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("Short URL code '" + shortCode + "' not found"));

        if (mapping.getExpiresAt() != null && mapping.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UrlExpiredException("Short URL code '" + shortCode + "' has expired");
        }

        mapping.incrementClicks();
        return repository.save(mapping);
    }

    @Transactional(readOnly = true)
    public UrlMapping getAnalytics(String shortCode) {
        return repository.findByShortCode(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("Short URL code '" + shortCode + "' not found"));
    }

    @Transactional(readOnly = true)
    public List<UrlMapping> getAllMappings() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void deleteUrl(String shortCode) {
        UrlMapping mapping = repository.findByShortCode(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("Short URL code '" + shortCode + "' not found"));
        repository.delete(mapping);
    }

    private String generateUniqueShortCode() {
        int maxAttempts = 10;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String code = generateRandomCode();
            if (!repository.existsByShortCode(code)) {
                return code;
            }
        }
        throw new UrlShortenerException("Failed to generate a unique short code. Please try again.");
    }

    private String generateRandomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHAR_POOL.charAt(random.nextInt(CHAR_POOL.length())));
        }
        return sb.toString();
    }
}
