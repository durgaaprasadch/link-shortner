package com.example.linkshortener.controller;

import com.example.linkshortener.exception.UrlExpiredException;
import com.example.linkshortener.exception.UrlNotFoundException;
import com.example.linkshortener.model.UrlMapping;
import com.example.linkshortener.service.UrlShortenerService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class RedirectController {

    private final UrlShortenerService service;

    public RedirectController(UrlShortenerService service) {
        this.service = service;
    }

    @GetMapping("/{shortCode:[a-zA-Z0-9-_]{3,30}}")
    public String redirect(@PathVariable String shortCode) {
        try {
            UrlMapping mapping = service.resolveAndTrack(shortCode);
            return "redirect:" + mapping.getLongUrl();
        } catch (UrlNotFoundException e) {
            return "redirect:/?error=not_found&code=" + shortCode;
        } catch (UrlExpiredException e) {
            return "redirect:/?error=expired&code=" + shortCode;
        } catch (Exception e) {
            return "redirect:/?error=unknown";
        }
    }
}
