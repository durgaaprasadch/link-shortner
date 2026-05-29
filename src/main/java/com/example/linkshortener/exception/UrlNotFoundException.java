package com.example.linkshortener.exception;

public class UrlNotFoundException extends UrlShortenerException {
    public UrlNotFoundException(String message) {
        super(message);
    }
}
