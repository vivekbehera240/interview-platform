package com.interviewprep.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
}








