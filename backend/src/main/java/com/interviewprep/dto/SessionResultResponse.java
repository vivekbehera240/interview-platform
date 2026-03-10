package com.interviewprep.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class SessionResultResponse {
    private Long sessionId;
    private String jobRole;
    private BigDecimal totalScore;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<QuestionResultDto> questions;
}