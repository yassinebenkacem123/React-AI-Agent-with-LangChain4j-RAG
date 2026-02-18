package com.example.langchain4j.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;

@Configuration
public class AiConfig {
    @Bean
    ChatMemoryProvider chatMemoryProvider(){
        return chatId->MessageWindowChatMemory.withMaxMessages(10);
    }
    
}
