import { useEffect, useRef, useState } from 'react';
import './App.css';
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
  try {
    return JSON.stringify(apiResponse);
  } catch {
    return String(apiResponse);
  }
}

function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

// Componente ChatInput estilizado com Tailwind
const ChatInput = ({ onSubmit }) => {
  const [question, setQuestion] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question);
      setQuestion("");
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="question" style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Peça a sua receita
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            id="question"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
            placeholder="Escreva seus alimentos:"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Qual receita você deseja?' },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleQuestionSubmit = async (question) => {
    console.log('[App] pergunta enviada:', question);
    setMessages((prev) => [...prev, { from: 'user', text: question }]);
    setLoading(true);

    try {
      const apiResponse = await fetchChatResponse(question);
      console.log('[App] resposta bruta da API:', apiResponse);

      let text = extractText(apiResponse);
      console.log('[App] texto extraído da resposta:', text);

      if (apiResponse?.candidates && apiResponse.candidates.length > 0) {
        const candidate = apiResponse.candidates[0];
        let recipeText = candidate.content?.parts[0]?.text || text;
        
        setMessages((prev) => [...prev, { 
          from: 'bot', 
          text: recipeText,
          rawResponse: apiResponse
        }]);
      } else {
        // Para outras estruturas de resposta
        setMessages((prev) => [...prev, { from: 'bot', text }]);
      }
    } catch (error) {
      console.error('[App] erro ao buscar resposta:', error);
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Ocorreu um erro ao gerar a resposta. Tente novamente.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#d1fae5',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header com gradiente verde */}
        <header style={{
          position: 'relative',
          background: 'linear-gradient(to right, #4ade80, #10b981)',
          color: 'white',
          textAlign: 'center',
          padding: '16px 24px',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          <button
            onClick={() => window.location.href = 'http://localhost:3000/homepage'}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#059669',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'white'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
          >
            Voltar
          </button>
          NutriAI
        </header>

        {/* Área de mensagens */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            maxHeight: '60vh',
            backgroundColor: '#f0fdf4',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: msg.from === 'user' ? '#10b981' : 'white',
                  color: msg.from === 'user' ? 'white' : '#1f2937',
                  border: msg.from === 'user' ? 'none' : '1px solid #e5e7eb',
                  boxShadow: msg.from === 'user' ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                {msg.rawResponse?.candidates ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>Receita:</div>
                    {msg.rawResponse.candidates.map((candidate, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#374151', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                          {cleanText(candidate.content?.parts[0]?.text || msg.text)}
                        </div>
                        
                        {candidate?.citationMetadata?.citations?.length > 0 && (
                          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>
                              Fontes consultadas:
                            </div>
                            <ul style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', padding: 0, margin: 0 }}>
                              {candidate.citationMetadata.citations.map((citation, idx) => (
                                <li key={idx} style={{ color: '#059669' }}>
                                  {citation.sources?.map((source, sourceIdx) => (
                                    <a
                                      key={sourceIdx}
                                      href={source.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ textDecoration: 'none', color: '#059669', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
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
                  <div style={{ lineHeight: '1.5' }}>
                    {msg.text}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                backgroundColor: 'white',
                color: '#6b7280',
                fontSize: '14px',
                padding: '12px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                maxWidth: '80%'
              }}>
                Gerando receita...
              </div>
            </div>
          )}
        </div>

        {/* Input - componente integrado */}
        <div style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white' }}>
          <ChatInput onSubmit={handleQuestionSubmit} />
        </div>
      </div>
    </div>
  );
}

export default App;