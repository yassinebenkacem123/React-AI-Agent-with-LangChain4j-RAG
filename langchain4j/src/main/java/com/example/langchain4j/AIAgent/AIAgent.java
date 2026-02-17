package com.example.langchain4j.AIAgent;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.spring.AiService;
import reactor.core.publisher.Flux;

@AiService
public interface AIAgent {
    @SystemMessage("""
            Your goal is to help the users, answer their questions clearly without problem
            """)
    Flux<String> chat(String message);


    
}