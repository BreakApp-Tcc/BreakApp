package com.nutriai.NutriAi.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Service
public class ReceitasService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;

    public ReceitasService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String getAnswer(String question) {
        try {
            // Corpo no formato EXATO que o Gemini espera
            Map<String, Object> requestBody = Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{
                                    Map.of("text", question)
                            })
                    }
            );

            // Envia a requisição à API Gemini
            String response = webClient.post()
                    .uri(geminiApiUrl + "?key=" + geminiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return response;

        } catch (WebClientResponseException e) {
            // Mostra o erro detalhado da API Gemini
            return "Erro ao chamar Gemini API: " + e.getRawStatusCode() + " - " + e.getResponseBodyAsString();
        } catch (Exception e) {
            // Captura outros erros
            return "Erro interno: " + e.getMessage();
        }
    }
}
