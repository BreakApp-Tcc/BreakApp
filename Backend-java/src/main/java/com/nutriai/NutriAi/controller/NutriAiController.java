package com.nutriai.NutriAi.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map; 

@RestController
@RequestMapping("/receitas")
public class NutriAiController {

    private final ReceitasService receitasService;

    public NutriAiController(ReceitasService receitasService) {
        this.receitasService = receitasService;
    }

    @PostMapping("/ask")
    public String pergunteAlgo(@RequestBody Map<String, String> payload) {
        String question = payload.get("question");
        if (question == null || question.isEmpty()) {
            return "Pergunta inválida!";
        }
        return receitasService.getAnswer(question);
    }
}
