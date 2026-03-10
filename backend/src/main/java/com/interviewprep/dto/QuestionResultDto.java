package com.interviewprep.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class QuestionResultDto {
    private Long id;
    private String questionText;
    private String type;
    private String difficulty;
    private String studentAnswer;
    private BigDecimal score;
    private String strengths;
    private String improvements;
    private List<String> suggestedTopics;
    private boolean answered;
}