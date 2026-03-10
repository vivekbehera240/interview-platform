package com.interviewprep.repository;

import com.interviewprep.model.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<InterviewSession> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT AVG(s.totalScore) FROM InterviewSession s WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
    Double findAverageScoreByUserId(Long userId);

    @Query("SELECT COUNT(s) FROM InterviewSession s WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
    Long countCompletedByUserId(Long userId);
}
