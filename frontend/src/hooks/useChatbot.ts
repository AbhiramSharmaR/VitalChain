import { useSOSStore } from '../store/sosStore';
import { getChatbotResponse } from '../api/emergency';

export const useChatbot = () => {
  const addChatMessage = useSOSStore((state) => state.addChatMessage);

  const sendMessage = async (userId: string, message: string) => {
    addChatMessage({ sender: 'user', text: message });
    try {
      const response = await getChatbotResponse(userId, message);
      addChatMessage({
        sender: 'bot',
        text: response?.response ?? "Sorry, I received an empty response.",
      });
    } catch (error) {
      console.error("Failed to get chatbot response", error);
      addChatMessage({ sender: 'bot', text: "Sorry, I am unable to connect to the medical assistant at this moment." });
    }
  };

  return { sendMessage };
};
