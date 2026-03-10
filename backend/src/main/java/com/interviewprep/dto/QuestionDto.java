package com.interviewprep.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class QuestionDto {
    private Long id;
    private String questionText;
    private String type;
    private String difficulty;
    private Integer order;
}