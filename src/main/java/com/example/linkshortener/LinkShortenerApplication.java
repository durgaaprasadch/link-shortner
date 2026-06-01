package com.example.linkshortener;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LinkShortenerApplication {

    public static void main(String[] args) {
        System.out.println("=== DIAGNOSTIC DB CONNECTION LOGS ===");
        String dsUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dsUrl != null) {
            // Mask password if present in URL (e.g. mysql://user:pass@host)
            System.out.println("SPRING_DATASOURCE_URL env: " + dsUrl.replaceAll(":[^:@/]+@", ":***@"));
        } else {
            System.out.println("SPRING_DATASOURCE_URL env: null");
        }
        System.out.println("MYSQLHOST env: " + System.getenv("MYSQLHOST"));
        System.out.println("MYSQLPORT env: " + System.getenv("MYSQLPORT"));
        System.out.println("MYSQLDATABASE env: " + System.getenv("MYSQLDATABASE"));
        System.out.println("MYSQLUSER env: " + System.getenv("MYSQLUSER"));
        System.out.println("======================================");
        SpringApplication.run(LinkShortenerApplication.class, args);
    }
}
