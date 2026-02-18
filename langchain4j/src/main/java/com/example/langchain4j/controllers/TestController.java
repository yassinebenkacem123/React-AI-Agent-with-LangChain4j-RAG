package com.example.langchain4j.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.langchain4j.AIAgent.AIAgent;

import reactor.core.publisher.Flux;


@RestController
@CrossOrigin("*")
public class TestController {


    @Autowired
    private AIAgent agent;

 
    @GetMapping("/chat")
    public Flux<String> chatMethod(@RequestParam(name="query") String query){
        return agent.chat(query);
    }
    
}
