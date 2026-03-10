package com.interviewprep.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class SessionStartRequest {
    private Long resumeId;
    private String jobRole;
    private Integer questionCount;
}