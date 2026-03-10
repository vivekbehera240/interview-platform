package com.interviewprep.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "interview_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    private QuestionType questionType;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private Integer questionOrder;

    @Column(columnDefinition = "TEXT")
    private String studentAnswer;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
    private String feedbackText;

    @Column(columnDefinition = "TEXT")
    private String strengthsText;

    @Column(columnDefinition = "TEXT")
    private String improvementsText;

    @Column(columnDefinition = "JSON")
    private String keywordsMatchedJson;

    @Column(columnDefinition = "JSON")
    private String suggestedTopicsJson;

    private boolean answered;

    public enum QuestionType {
        TECHNICAL, CONCEPTUAL, BEHAVIORAL, SYSTEM_DESIGN
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }
}
