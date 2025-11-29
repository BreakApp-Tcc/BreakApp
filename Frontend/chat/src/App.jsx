import { useEffect, useRef, useState } from 'react';
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

function App() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Qual receita você deseja?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion("");
    setMessages((prev) => [...prev, { from: 'user', text: userQuestion }]);
    setLoading(true);

    try {
      const apiResponse = await fetchChatResponse(userQuestion);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      
      <div style={{ 
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Sidebar */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          height: '100vh',
          position: 'relative',
          justifyContent: 'space-between',
          minWidth: sidebarOpen ? '220px' : '80px',
          transition: 'all 0.4s ease',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
        }}>
          <div style={{ padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'start', marginBottom: '30px' }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '50px',
                  padding: '15px',
                  backgroundColor: '#ffffff',
                  fontSize: '16px',
                  color: '#4b5563',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            </div>
            
            <ul style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '25px',
              alignItems: 'center',
              padding: 0,
              margin: 0
            }}>
              <li style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '15px',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <a href="http://localhost:3000/dieta" style={{
                  textDecoration: 'none',
                  display: 'flex',
                  color: '#4b5563',
                  alignItems: 'center',
                  gap: sidebarOpen ? '13px' : '0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}>
                  <i className="fa-solid fa-utensils" style={{ fontSize: '18px' }}></i>
                  <span style={{
                    width: sidebarOpen ? 'auto' : '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    fontSize: '14px',
                    transition: 'all 0.4s ease'
                  }}>Dieta</span>
                </a>
              </li>
              
              <li style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '15px',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <a href="http://localhost:3000/alimentos" style={{
                  textDecoration: 'none',
                  display: 'flex',
                  color: '#4b5563',
                  alignItems: 'center',
                  gap: sidebarOpen ? '13px' : '0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}>
                  <i className="fa-solid fa-id-card" style={{ fontSize: '18px' }}></i>
                  <span style={{
                    width: sidebarOpen ? 'auto' : '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    fontSize: '14px',
                    transition: 'all 0.4s ease'
                  }}>Alimentos</span>
                </a>
              </li>
              
              <li style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '15px',
                width: '100%',
                backgroundColor: '#f0fdf4',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#dcfce7'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f0fdf4'}>
                <a href="http://localhost:3000/nutria" style={{
                  textDecoration: 'none',
                  display: 'flex',
                  color: '#9bca9f',
                  alignItems: 'center',
                  gap: sidebarOpen ? '13px' : '0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  fontWeight: '600'
                }}>
                  <i className="fa-solid fa-comment" style={{ fontSize: '18px' }}></i>
                  <span style={{
                    width: sidebarOpen ? 'auto' : '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    fontSize: '14px',
                    transition: 'all 0.4s ease'
                  }}>NutrIA</span>
                </a>
              </li>
              
              <li style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '15px',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <a href="http://localhost:3000/planos" style={{
                  textDecoration: 'none',
                  display: 'flex',
                  color: '#4b5563',
                  alignItems: 'center',
                  gap: sidebarOpen ? '13px' : '0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}>
                  <i className="fa-solid fa-pen-to-square" style={{ fontSize: '18px' }}></i>
                  <span style={{
                    width: sidebarOpen ? 'auto' : '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    fontSize: '14px',
                    transition: 'all 0.4s ease'
                  }}>Planos</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div style={{ padding: '15px', marginTop: 'auto' }}>
            <ul style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 0,
              margin: 0
            }}>
              <li style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '15px',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <a href="http://localhost:3000/configuracoes" style={{
                  textDecoration: 'none',
                  display: 'flex',
                  color: '#4b5563',
                  alignItems: 'center',
                  gap: sidebarOpen ? '13px' : '0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}>
                  <i className="fa-solid fa-gear" style={{ fontSize: '18px' }}></i>
                  <span style={{
                    width: sidebarOpen ? 'auto' : '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    fontSize: '14px',
                    transition: 'all 0.4s ease'
                  }}>Configurações</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        {/* Conteúdo Principal */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1,
          height: '100vh'
        }}>
          {/* Header fixo */}
          <header style={{ 
            backgroundColor: 'white', 
            borderBottom: '1px solid #e5e7eb', 
            padding: '12px 16px', 
            display: 'flex', 
            alignItems: 'center',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              NutriAI
            </h1>
          </header>

          {/* Área de mensagens */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            backgroundColor: 'transparent'
          }}>
            <div style={{ 
              maxWidth: '768px', 
              margin: '0 auto', 
              padding: '24px 16px' 
            }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    maxWidth: '85%',
                    flexDirection: msg.from === 'user' ? 'row-reverse' : 'row'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      backgroundColor: msg.from === 'user' ? '#9bca9f' : 'transparent',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      overflow: 'hidden'
                    }}>
                      {msg.from === 'user' ? 'V' : (
                        <img 
                          src="/nutribot.png"
                          alt="NutriAI Bot" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>

                    {/* Mensagem */}
                    <div style={{
                      borderRadius: '16px',
                      padding: '12px 16px',
                      backgroundColor: msg.from === 'user' ? '#9bca9f' : 'white',
                      color: msg.from === 'user' ? 'white' : '#1f2937',
                      border: msg.from === 'user' ? 'none' : '1px solid #e5e7eb',
                      boxShadow: msg.from === 'user' ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}>
                      {msg.rawResponse?.candidates ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '16px', marginBottom: '12px' }}>
                            Receita:
                          </div>
                          {msg.rawResponse.candidates.map((candidate, i) => (
                            <div key={i}>
                              <div style={{ 
                                color: '#374151', 
                                whiteSpace: 'pre-line', 
                                lineHeight: '1.6' 
                              }}>
                                {cleanText(candidate.content?.parts[0]?.text || msg.text)}
                              </div>
                              
                              {candidate?.citationMetadata?.citations?.length > 0 && (
                                <div style={{ 
                                  marginTop: '16px', 
                                  paddingTop: '12px', 
                                  borderTop: '1px solid #e5e7eb' 
                                }}>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '600', 
                                    color: '#6b7280', 
                                    marginBottom: '8px' 
                                  }}>
                                    Fontes consultadas:
                                  </div>
                                  <ul style={{ 
                                    fontSize: '12px', 
                                    listStyle: 'none', 
                                    padding: 0, 
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                  }}>
                                    {candidate.citationMetadata.citations.map((citation, idx) => (
                                      <li key={idx}>
                                        {citation.sources?.map((source, sourceIdx) => (
                                          <a
                                            key={sourceIdx}
                                            href={source.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ 
                                              color: '#9bca9f', 
                                              textDecoration: 'none',
                                              display: 'block',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap'
                                            }}
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
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      <img 
                        src="/nutribot.png"
                        alt="NutriAI Bot" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#9ca3af',
                          borderRadius: '50%',
                          animation: 'bounce 1s infinite'
                        }}></div>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#9ca3af',
                          borderRadius: '50%',
                          animation: 'bounce 1s infinite 0.15s'
                        }}></div>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#9ca3af',
                          borderRadius: '50%',
                          animation: 'bounce 1s infinite 0.3s'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input fixo no rodapé */}
          <div style={{ 
            borderTop: '1px solid #e5e7eb', 
            backgroundColor: 'white',
            padding: '16px'
          }}>
            <div style={{ maxWidth: '768px', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite seus ingredientes ou peça uma receita..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: loading ? '#f3f4f6' : 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#9bca9f';
                    e.target.style.boxShadow = '0 0 0 3px rgba(155, 202, 159, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !question.trim()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (loading || !question.trim()) ? '#d1d5db' : '#9bca9f',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: (loading || !question.trim()) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && question.trim()) {
                      e.target.style.backgroundColor = '#7db882';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && question.trim()) {
                      e.target.style.backgroundColor = '#9bca9f';
                    }
                  }}
                >
                  Enviar
                </button>
              </div>
              <p style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                textAlign: 'center', 
                marginTop: '8px',
                marginBottom: 0
              }}>
                NutriAI pode cometer erros. Verifique informações importantes.
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </div>
    </>
  );
}

export default App;