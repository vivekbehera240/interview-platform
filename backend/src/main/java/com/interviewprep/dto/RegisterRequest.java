package com.interviewprep.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
}