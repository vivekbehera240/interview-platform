package com.interviewprep.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewprep.model.Resume;
import com.interviewprep.model.User;
import com.interviewprep.repository.ResumeRepository;
import com.interviewprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;  // ← changed from ClaudeService
    private final ObjectMapper objectMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public Resume uploadResume(MultipartFile file, String userEmail) throws IOException {
        if (!Objects.requireNonNull(file.getOriginalFilename()).toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be under 10 MB");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Save file
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Extract text
        String extractedText = extractTextFromPdf(file.getInputStream());

        Resume resume = Resume.builder()
                .user(user)
                .fileName(file.getOriginalFilename())
                .filePath(filePath.toString())
                .extractedText(extractedText)
                .status(Resume.ProcessingStatus.PROCESSING)
                .build();
        resume = resumeRepository.save(resume);

        // Extract skills via Gemini
        try {
            String skillsJson = geminiService.extractSkillsFromResume(extractedText);  // ← changed
            resume.setSkillsJson(skillsJson);
            resume.setStatus(Resume.ProcessingStatus.COMPLETED);
        } catch (Exception e) {
            log.error("Skill extraction failed for resume {}: {}", resume.getId(), e.getMessage());
            resume.setStatus(Resume.ProcessingStatus.FAILED);
        }

        return resumeRepository.save(resume);
    }

    public Map<String, Object> getResumeSkills(Long resumeId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Resume resume = resumeRepository.findByIdAndUserId(resumeId, user.getId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        if (resume.getSkillsJson() == null) {
            return Map.of("status", "PROCESSING", "message", "Skills are still being extracted");
        }

        try {
            JsonNode node = objectMapper.readTree(resume.getSkillsJson());
            Map<String, Object> result = new HashMap<>();
            result.put("resumeId", resume.getId());
            result.put("fileName", resume.getFileName());
            result.put("status", resume.getStatus());
            result.put("skills", node);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse skills data");
        }
    }

    public List<Resume> getUserResumes(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return resumeRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
    }

    private String extractTextFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
}