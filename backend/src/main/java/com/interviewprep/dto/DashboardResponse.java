package com.interviewprep.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    private String fullName;
    private Long completedSessions;
    private BigDecimal averageScore;
    private int totalSessions;
    private List<SessionSummaryDto> sessions;
}