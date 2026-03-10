package com.interviewprep.repository;

import com.interviewprep.model.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findBySessionIdOrderByQuestionOrder(Long sessionId);
    long countBySessionIdAndAnsweredTrue(Long sessionId);
}
