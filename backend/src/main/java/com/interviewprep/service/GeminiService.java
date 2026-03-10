package com.interviewprep.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiService {

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL    = "llama-3.3-70b-versatile";

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public String extractSkillsFromResume(String resumeText) {
        String systemPrompt = "You are a professional technical resume parser. " +
                "Extract structured information from resumes. " +
                "Respond ONLY with a valid JSON object. No explanation, no markdown, no code blocks. " +
                "Use exactly this schema: " +
                "{\"skills\": [\"string\"], \"experience_level\": \"junior|mid|senior\", " +
                "\"years_of_experience\": number, \"recommended_roles\": [\"string\"], " +
                "\"education\": \"string\", \"summary\": \"string\"}";

        String userPrompt = "Parse this resume and extract structured information:\n\n" + resumeText;
        return callGroq(systemPrompt, userPrompt);
    }

    public String generateInterviewQuestions(String jobRole, List<String> skills,
                                             String experienceLevel, int count) {
        String systemPrompt = "You are a senior technical interviewer at a top tech company. " +
                "Generate realistic interview questions tailored to the candidate profile. " +
                "Respond ONLY with a valid JSON array. No explanation, no markdown, no code blocks. " +
                "Each element must have exactly: " +
                "{\"id\": number, \"question\": \"string\", " +
                "\"type\": \"TECHNICAL|CONCEPTUAL|BEHAVIORAL|SYSTEM_DESIGN\", " +
                "\"difficulty\": \"EASY|MEDIUM|HARD\", \"expected_keywords\": [\"string\"]}";

        String userPrompt = String.format(
                "Generate exactly %d interview questions for a %s position. " +
                        "Candidate skills: %s. Experience level: %s. " +
                        "Distribution: 50%% TECHNICAL, 30%% CONCEPTUAL, 20%% BEHAVIORAL.",
                count, jobRole, String.join(", ", skills), experienceLevel);

        return callGroq(systemPrompt, userPrompt);
    }

    public String evaluateAnswer(String question, String studentAnswer,
                                 List<String> expectedKeywords) {
        String systemPrompt = "You are an expert technical interviewer providing constructive feedback. " +
                "Be fair, specific, and encouraging. " +
                "Respond ONLY with a valid JSON object. No explanation, no markdown, no code blocks. " +
                "Use exactly this schema: " +
                "{\"score\": number (0-100), \"strengths\": \"string\", " +
                "\"improvements\": \"string\", \"keywords_matched\": [\"string\"], " +
                "\"suggested_topics\": [\"string\"]}";

        String userPrompt = String.format(
                "Evaluate this interview answer.\nQuestion: %s\nExpected concepts: %s\nAnswer: %s",
                question, String.join(", ", expectedKeywords), studentAnswer);

        return callGroq(systemPrompt, userPrompt);
    }

    public String analyzeSkillGaps(List<String> studentSkills, String targetRole,
                                   List<String> sessionResults) {
        String systemPrompt = "You are a career coach analyzing skill gaps for a student. " +
                "Respond ONLY with a valid JSON object. No explanation, no markdown, no code blocks. " +
                "Use exactly this schema: " +
                "{\"gaps\": [{\"skill\": \"string\", \"priority\": \"HIGH|MEDIUM|LOW\", " +
                "\"description\": \"string\", \"resources\": [\"string\"]}], " +
                "\"strengths\": [\"string\"], \"overall_readiness\": number, \"summary\": \"string\"}";

        String userPrompt = String.format(
                "Analyze skill gaps for a student targeting: %s. " +
                        "Current skills: %s. Interview notes: %s.",
                targetRole, String.join(", ", studentSkills), String.join("; ", sessionResults));

        return callGroq(systemPrompt, userPrompt);
    }

    private String callGroq(String systemPrompt, String userPrompt) {
        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.7,
                "max_tokens", 2048
        );

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                WebClient client = webClientBuilder
                        .baseUrl(BASE_URL)
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                        .build();

                String response = client.post()
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(response);
                String text = root
                        .path("choices").get(0)
                        .path("message")
                        .path("content").asText();

                text = text.replaceAll("(?s)```json\\s*", "")
                        .replaceAll("(?s)```\\s*", "")
                        .trim();

                if (text.startsWith("{") || text.startsWith("[")) return text;

                int start = text.indexOf('{');
                int startArr = text.indexOf('[');
                if (startArr != -1 && (start == -1 || startArr < start)) start = startArr;
                if (start != -1) return text.substring(start);

                throw new RuntimeException("Groq did not return valid JSON: " + text);

            } catch (Exception e) {
                log.warn("Groq attempt {}/{} failed: {}", attempt, maxRetries, e.getMessage());
                if (attempt < maxRetries) {
                    try { Thread.sleep(2000L * attempt); }
                    catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                } else {
                    log.error("Groq API call failed after {} attempts", maxRetries);
                    throw new RuntimeException("AI service temporarily unavailable. Please try again.", e);
                }
            }
        }
        throw new RuntimeException("AI service temporarily unavailable.");
    }
}