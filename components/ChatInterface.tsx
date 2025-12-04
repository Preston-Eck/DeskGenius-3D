import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ChatMessage, ProjectConfig } from '../types';
import { chatWithAi } from '../services/geminiService';

interface ChatInterfaceProps {
  deskConfig: ProjectConfig;
  setDeskConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  uploadedImage: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ deskConfig, setDeskConfig, uploadedImage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'I can help you design your built-in unit! Upload a photo of your wall, or tell me about your TV and storage needs.', timestamp: Date.now() }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const aiResponseText = await chatWithAi(
        history, 
        userMsg.text, 
        deskConfig, 
        (updates) => {
            setDeskConfig(prev => ({ ...prev, ...updates }));
        },
        uploadedImage || undefined
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         text: "Sorry, I had trouble connecting. Please try again.",
         timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">AI Design Assistant</h2>
        <p className="text-xs text-gray-500">Powered by Gemini 2.5</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
               <span className="text-xs text-gray-500">Thinking...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-gray-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-500"
            placeholder="Add TV gap, change layout..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !uploadedImage)}
            className="text-brand-600 hover:text-brand-800 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {uploadedImage && (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Image included in context
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
