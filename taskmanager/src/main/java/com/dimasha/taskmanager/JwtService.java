package com.dimasha.taskmanager;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final String encodedSecret;
    private final long expirationMillis;
    private SecretKey signingKey;

    public JwtService(
            @Value("${app.jwt.secret}") String encodedSecret,
            @Value("${app.jwt.expiration}") long expirationMillis) {
        this.encodedSecret = encodedSecret;
        this.expirationMillis = expirationMillis;
    }

    @PostConstruct
    void validateConfiguration() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(encodedSecret);
            if (keyBytes.length < 32) {
                throw new IllegalStateException("JWT_SECRET must decode to at least 32 bytes for HS256");
            }
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT_SECRET must be a valid Base64-encoded key", exception);
        }
        if (expirationMillis <= 0) {
            throw new IllegalStateException("app.jwt.expiration must be greater than zero");
        }
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(new Date(now.toEpochMilli() + expirationMillis))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.valueOf(claims.getSubject());
    }
}
