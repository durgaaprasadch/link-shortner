package com.example.linkshortener.exception;

public class UrlExpiredException extends UrlShortenerException {
    public UrlExpiredException(String message) {
        super(message);
    }
}
