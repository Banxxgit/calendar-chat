import { useState, useRef, useEffect } from 'react';
import { Calendar, Send, Clock, AlertCircle } from 'lucide-react';

export default function CalendarChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hi! I'm your calendar assistant. I can help you schedule meetings, check your availability, and manage your events. What would you like to do?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showConfig, setShowConfig] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || !n8nWebhookUrl) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          sessionId: sessionId,
          timestamp: userMessage.timestamp.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the assistant's response - adjust based on your n8n output structure
      const assistantText = data.response || data.message || data.output || JSON.stringify(data);

      const assistantMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: assistantText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      console.error('Error sending message:', err);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        text: `Error: Could not reach the assistant. Please check your webhook URL and try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleConfigSave = () => {
    if (n8nWebhookUrl.trim()) {
      setShowConfig(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Calendar Assistant</h1>
              <p className="text-sm text-gray-500">
                {n8nWebhookUrl ? 'Connected' : 'Not configured'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showConfig ? 'Hide' : 'Show'} Config
          </button>
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">n8n Webhook Configuration</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleConfigSave}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter your n8n webhook URL. The chat will send POST requests with: message, sessionId, timestamp
            </p>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 
              message.sender === 'system' ? 'justify-center' : 'justify-start'
            }`}
          >
            <div className={`max-w-lg ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : message.sender === 'system'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                }`}
              >
                {message.sender === 'system' && (
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
              <div className={`flex items-center gap-1 mt-1 px-2 ${
                message.sender === 'user' ? 'justify-end' : 
                message.sender === 'system' ? 'justify-center' : 'justify-start'
              }`}>
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-3">
          <div className="flex items-center gap-2 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        {!n8nWebhookUrl ? (
          <div className="text-center py-2 text-sm text-gray-500">
            Please configure your n8n webhook URL above to start chatting
          </div>
        ) : (
          <>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me to schedule a meeting, check your calendar..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows="1"
                  style={{ maxHeight: '120px' }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={input.trim() === '' || isLoading}
                className={`p-3 rounded-xl transition-colors ${
                  input.trim() === '' || isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </>
        )}
      </div>
    </div>
  );
}