package com.interviewprep.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class SessionSummaryDto {
    private Long id;
    private String jobRole;
    private BigDecimal totalScore;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}