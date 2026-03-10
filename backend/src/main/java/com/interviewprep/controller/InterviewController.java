package com.interviewprep.controller;

import com.interviewprep.dto.*;
import com.interviewprep.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @GetMapping("/roles")
    public ResponseEntity<?> getRoles() {
        return ResponseEntity.ok(Map.of("roles", interviewService.getAvailableRoles()));
    }

    @PostMapping("/sessions/start")
    public ResponseEntity<?> startSession(
            @RequestBody SessionStartRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            SessionStartResponse response = interviewService.startSession(request, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sessions/{sessionId}/answers/{questionId}")
    public ResponseEntity<?> submitAnswer(
            @PathVariable Long sessionId,
            @PathVariable Long questionId,
            @RequestBody AnswerSubmitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            AnswerResponse response = interviewService.submitAnswer(
                    sessionId, questionId, request.getAnswer(), userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sessions/{sessionId}/results")
    public ResponseEntity<?> getResults(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(interviewService.getSessionResults(sessionId, userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(interviewService.getDashboard(userDetails.getUsername()));
    }
}
