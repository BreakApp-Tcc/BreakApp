import { useEffect, useRef, useState } from 'react';
import './App.css';
import ChatInput from './components/ChatInput';
import ChatResponse from './components/ChatResponse';
import { fetchChatResponse } from './services/api';

function extractText(apiResponse) {
  if (!apiResponse) return '';
  if (typeof apiResponse === 'string') return apiResponse;
  if (apiResponse?.content) return apiResponse.content;
  if (apiResponse?.resposta) return apiResponse.resposta;
  if (apiResponse?.answer) return apiResponse.answer;
  if (apiResponse?.message?.content) return apiResponse.message.content;
  if (Array.isArray(apiResponse?.candidates) && apiResponse.candidates[0]) {
    return apiResponse.candidates[0].content?.parts[0]?.text || '';
  }
  if (Array.isArray(apiResponse?.choices) && apiResponse.choices[0]) {
    return (
      apiResponse.choices[0].message?.content ??
      apiResponse.choices[0].text ??
      JSON.stringify(apiResponse)
    );
  }
  // fallback: transform object to readable string
  try {
    return JSON.stringify(apiResponse);
  } catch {
    return String(apiResponse);
  }
}

// Função para remover asteriscos e formatar o texto
function cleanText(text) {
  if (!text) return '';
  
  // Remove asteriscos e formatação markdown simples
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **negrito**
    .replace(/\*(.*?)\*/g, '$1')     // Remove *itálico*
    .replace(/#{1,6}\s?/g, '')       // Remove # headers
    .replace(/`(.*?)`/g, '$1')       // Remove `code`
    .trim();
}

function App() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Qual receita você deseja?' },
  ]);
<div>style={{ whiteSpace: '' }}</div>
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    // autoscroll para o fim quando mensagens mudam
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleQuestionSubmit = async (question) => {
    console.log('[App] pergunta enviada:', question);
    // mostra pergunta na UI
    setMessages((prev) => [...prev, { from: 'user', text: question }]);
    setLoading(true);

    try {
      const apiResponse = await fetchChatResponse(question);
      console.log('[App] resposta bruta da API:', apiResponse);

      let text = extractText(apiResponse);
      console.log('[App] texto extraído da resposta:', text);

      // Limpa o texto removendo asteriscos e formatação
      text = cleanText(text);

      // Se a API retornar candidatos (como no Google Gemini), formata a resposta
      if (apiResponse?.candidates && apiResponse.candidates.length > 0) {
        const candidate = apiResponse.candidates[0];
        let recipeText = candidate.content?.parts[0]?.text || text;
        
        // Limpa o texto da receita também
        recipeText = cleanText(recipeText);
        
        // Atualiza messages com a resposta formatada
        setMessages((prev) => [...prev, { 
          from: 'bot', 
          text: recipeText,
          rawResponse: apiResponse // mantém a resposta completa para exibição detalhada
        }]);
      } else {
        // Para outras APIs, usa o texto extraído e limpo
        setMessages((prev) => [...prev, { from: 'bot', text }]);
      }
    } catch (error) {
      console.error('[App] erro ao buscar resposta:', error);
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: '❌ Ocorreu um erro ao gerar a resposta.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden border border-gray-200">
        {/* Header com gradiente verde */}
        <header className="bg-gradient-to-r from-black-500 to-black-600 text-black text-center py-4 font-bold text-lg">
          NutriAI
        </header>

        {/* Área de mensagens */}
        <div
          ref={listRef}
          className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[60vh] bg-green-500"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start ${
                msg.from === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.from === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center mr-2 text-green-700 font-bold text-sm mt-1">
                  🤖
                </div>
              )}
              
              <div
                style={{ whiteSpace: 'pre-wrap' }}
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed border ${
                  msg.from === 'user'
                    ? 'bg-black-500 text-black rounded-2xl'
                    : 'bg-green text-gray-800 rounded-2xl border border-black-200 shadow-sm'
                }`}
              >
                {/* Exibe a resposta formatada com citações se disponível */}
                {msg.rawResponse?.candidates ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 mb-2 text-base">Receita:</h3>
                    {msg.rawResponse.candidates.map((candidate, i) => (
                      <div key={i} className="space-y-3">
                        <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                          {cleanText(candidate.content?.parts[0]?.text || msg.text)}
                        </div>
                        
                        {candidate?.citationMetadata?.citations?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">Fontes consultadas:</h6>
                            <ul className="text-xs space-y-1">
                              {candidate.citationMetadata.citations.map((citation, idx) => (
                                <li key={idx} className="text-green-500">
                                  {citation.sources?.map((source, sourceIdx) => (
                                    <a
                                      key={sourceIdx}
                                      href={source.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline block"
                                    >
                                      {source.uri}
                                    </a>
                                  ))}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Exibe texto normal da mensagem (já limpo)
                  <div className="leading-relaxed">
                    {msg.text}
                  </div>
                )}
              </div>

              {msg.from === 'user' && (
                <div className="w-8 h-8 rounded-full bg-black-200 flex items-center justify-center mr-2 text-black-700 font-bold text-sm mt-1">
                  🙂
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-start">
              <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center mr-2 text-green-700 font-bold text-sm mt-1">
                🤖
              </div>
              <div className="bg-white text-gray-500 text-sm p-4 rounded-2xl border border-gray-200 shadow-sm max-w-[85%]">
                Gerando receita...
              </div>
            </div>
          )}
        </div>

        {/* Input - seu componente */}
        <div className="border-t border-gray-200 bg-white">
          <ChatInput onSubmit={handleQuestionSubmit} />
        </div>
      </div>
    </div>
  );
}

export default App;