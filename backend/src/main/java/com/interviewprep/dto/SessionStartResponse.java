package com.interviewprep.dto;

import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class SessionStartResponse {
    private Long sessionId;
    private String jobRole;
    private List<QuestionDto> questions;
    private List<String> detectedSkills;
    private String experienceLevel;
}