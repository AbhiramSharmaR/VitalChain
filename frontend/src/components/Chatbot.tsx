import React, { useState } from 'react';
import { useSOSStore } from '../store/sosStore';
import { useChatbot } from '../hooks/useChatbot';
import { Send } from 'lucide-react';

export const Chatbot: React.FC<{ userId: string }> = ({ userId }) => {
  const [input, setInput] = useState('');
  const messages = useSOSStore((state) => state.chatbotMessages);
  const { sendMessage } = useChatbot();

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(userId, input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Medical Assistant AI</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
           <p className="text-gray-400 text-center mt-4 text-sm">Ask me anything about the current emergency or your vitals.</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-[80%] ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
