package com.example.linkshortener.exception;

public class AliasAlreadyExistsException extends UrlShortenerException {
    public AliasAlreadyExistsException(String message) {
        super(message);
    }
}
