package com.interviewprep.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewprep.dto.*;
import com.interviewprep.model.*;
import com.interviewprep.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;  // ← changed from ClaudeService
    private final ObjectMapper objectMapper;

    private static final List<String> AVAILABLE_ROLES = List.of(
            "Backend Developer", "Frontend Developer", "Full Stack Developer",
            "Data Science", "Machine Learning Engineer", "DevOps Engineer",
            "Android Developer", "iOS Developer", "Cloud Engineer",
            "Software Engineer (General)"
    );

    public List<String> getAvailableRoles() {
        return AVAILABLE_ROLES;
    }

    @Transactional
    public SessionStartResponse startSession(SessionStartRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Resume resume = resumeRepository.findByIdAndUserId(request.getResumeId(), user.getId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        // Parse skills from resume
        List<String> skills = new ArrayList<>();
        String experienceLevel = "junior";
        try {
            JsonNode skillsNode = objectMapper.readTree(resume.getSkillsJson());
            skillsNode.path("skills").forEach(s -> skills.add(s.asText()));
            experienceLevel = skillsNode.path("experience_level").asText("junior");
        } catch (Exception e) {
            log.warn("Could not parse skills from resume, using defaults");
        }

        if (skills.isEmpty()) {
            skills.addAll(List.of("Java", "Problem Solving", "Algorithms"));
        }

        // Create session
        InterviewSession session = InterviewSession.builder()
                .user(user)
                .resume(resume)
                .jobRole(request.getJobRole())
                .status(InterviewSession.SessionStatus.IN_PROGRESS)
                .build();
        session = sessionRepository.save(session);

        // Generate questions via Gemini
        int questionCount = Optional.ofNullable(request.getQuestionCount()).orElse(8);
        String questionsJson = geminiService.generateInterviewQuestions(  // ← changed
                request.getJobRole(), skills, experienceLevel, questionCount);

        List<InterviewQuestion> questions = parseAndSaveQuestions(questionsJson, session);

        return new SessionStartResponse(
                session.getId(),
                session.getJobRole(),
                questions.stream().map(this::toQuestionDto).toList(),
                skills,
                experienceLevel
        );
    }

    @Transactional
    public AnswerResponse submitAnswer(Long sessionId, Long questionId, String answer, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        InterviewSession session = sessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() == InterviewSession.SessionStatus.COMPLETED) {
            throw new IllegalStateException("Session is already completed");
        }

        InterviewQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (!question.getSession().getId().equals(sessionId)) {
            throw new IllegalArgumentException("Question does not belong to this session");
        }

        // Get expected keywords
        List<String> expectedKeywords = new ArrayList<>();
        try {
            if (question.getKeywordsMatchedJson() != null) {
                expectedKeywords = objectMapper.readValue(question.getKeywordsMatchedJson(),
                        new TypeReference<>() {});
            }
        } catch (Exception ignored) {}

        // Evaluate answer via Gemini
        String evaluationJson = geminiService.evaluateAnswer(  // ← changed
                question.getQuestionText(), answer, expectedKeywords);

        try {
            JsonNode eval = objectMapper.readTree(evaluationJson);
            question.setStudentAnswer(answer);
            question.setScore(BigDecimal.valueOf(eval.path("score").asDouble(0)));
            question.setStrengthsText(eval.path("strengths").asText());
            question.setImprovementsText(eval.path("improvements").asText());
            question.setKeywordsMatchedJson(eval.path("keywords_matched").toString());
            question.setSuggestedTopicsJson(eval.path("suggested_topics").toString());
            question.setFeedbackText(eval.path("strengths").asText() + "\n\n" + eval.path("improvements").asText());
            question.setAnswered(true);
            questionRepository.save(question);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process evaluation: " + e.getMessage());
        }

        // Check if all questions answered
        List<InterviewQuestion> allQuestions = questionRepository.findBySessionIdOrderByQuestionOrder(sessionId);
        long answeredCount = allQuestions.stream().filter(InterviewQuestion::isAnswered).count();

        SessionResultResponse sessionResult = null;
        if (answeredCount == allQuestions.size()) {
            sessionResult = completeSession(session, allQuestions);
        }

        return new AnswerResponse(
                question.getScore(),
                question.getStrengthsText(),
                question.getImprovementsText(),
                parseList(question.getKeywordsMatchedJson()),
                parseList(question.getSuggestedTopicsJson()),
                (int) answeredCount,
                allQuestions.size(),
                sessionResult
        );
    }

    public SessionResultResponse getSessionResults(Long sessionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        InterviewSession session = sessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderByQuestionOrder(sessionId);
        return buildSessionResult(session, questions);
    }

    public DashboardResponse getDashboard(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<InterviewSession> sessions = sessionRepository.findByUserIdOrderByStartedAtDesc(user.getId());
        Double avgScore = sessionRepository.findAverageScoreByUserId(user.getId());
        Long completedCount = sessionRepository.countCompletedByUserId(user.getId());

        List<SessionSummaryDto> sessionSummaries = sessions.stream()
                .map(s -> new SessionSummaryDto(
                        s.getId(), s.getJobRole(),
                        s.getTotalScore(), s.getStatus().name(),
                        s.getStartedAt(), s.getCompletedAt()))
                .toList();

        return new DashboardResponse(
                user.getFullName(),
                completedCount,
                avgScore != null ? BigDecimal.valueOf(avgScore).setScale(1, RoundingMode.HALF_UP) : null,
                sessions.size(),
                sessionSummaries
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private List<InterviewQuestion> parseAndSaveQuestions(String json, InterviewSession session) {
        List<InterviewQuestion> questions = new ArrayList<>();
        try {
            JsonNode arr = objectMapper.readTree(json);
            int order = 1;
            for (JsonNode q : arr) {
                InterviewQuestion iq = new InterviewQuestion();
                iq.setSession(session);
                iq.setQuestionText(q.path("question").asText());
                iq.setQuestionOrder(order++);
                iq.setAnswered(false);

                String typeStr = q.path("type").asText("TECHNICAL");
                try { iq.setQuestionType(InterviewQuestion.QuestionType.valueOf(typeStr)); }
                catch (Exception e) { iq.setQuestionType(InterviewQuestion.QuestionType.TECHNICAL); }

                String diffStr = q.path("difficulty").asText("MEDIUM");
                try { iq.setDifficulty(InterviewQuestion.Difficulty.valueOf(diffStr)); }
                catch (Exception e) { iq.setDifficulty(InterviewQuestion.Difficulty.MEDIUM); }

                iq.setKeywordsMatchedJson(q.path("expected_keywords").toString());

                questions.add(questionRepository.save(iq));
            }
        } catch (Exception e) {
            log.error("Failed to parse questions JSON: {}", e.getMessage());
            throw new RuntimeException("Failed to generate questions. Please try again.");
        }
        return questions;
    }

    private SessionResultResponse completeSession(InterviewSession session, List<InterviewQuestion> questions) {
        double avgScore = questions.stream()
                .filter(q -> q.getScore() != null)
                .mapToDouble(q -> q.getScore().doubleValue())
                .average()
                .orElse(0);

        session.setTotalScore(BigDecimal.valueOf(avgScore).setScale(2, RoundingMode.HALF_UP));
        session.setStatus(InterviewSession.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);

        return buildSessionResult(session, questions);
    }

    private SessionResultResponse buildSessionResult(InterviewSession session, List<InterviewQuestion> questions) {
        List<QuestionResultDto> qResults = questions.stream()
                .map(q -> new QuestionResultDto(
                        q.getId(), q.getQuestionText(),
                        q.getQuestionType() != null ? q.getQuestionType().name() : "TECHNICAL",
                        q.getDifficulty() != null ? q.getDifficulty().name() : "MEDIUM",
                        q.getStudentAnswer(), q.getScore(),
                        q.getStrengthsText(), q.getImprovementsText(),
                        parseList(q.getSuggestedTopicsJson()),
                        q.isAnswered()))
                .toList();

        return new SessionResultResponse(
                session.getId(), session.getJobRole(),
                session.getTotalScore(), session.getStatus().name(),
                session.getStartedAt(), session.getCompletedAt(),
                qResults
        );
    }

    private QuestionDto toQuestionDto(InterviewQuestion q) {
        return new QuestionDto(q.getId(), q.getQuestionText(),
                q.getQuestionType() != null ? q.getQuestionType().name() : "TECHNICAL",
                q.getDifficulty() != null ? q.getDifficulty().name() : "MEDIUM",
                q.getQuestionOrder());
    }

    private List<String> parseList(String json) {
        if (json == null) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}