package com.interviewprep.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class AnswerResponse {
    private BigDecimal score;
    private String strengths;
    private String improvements;
    private List<String> keywordsMatched;
    private List<String> suggestedTopics;
    private int answeredCount;
    private int totalCount;
    private SessionResultResponse sessionResult;
}