import axios from "axios";
import "dotenv/config"
// const API_URL = process.env.GENAGENTS_SEVER_URL; 
const API_URL = "http://127.0.0.1:5000"; 


export const sendMessage = async (message) => {
  try {
    const response = await axios.post(`${API_URL}/chat`, { message });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    return { error: "Failed to get response from server" };
  }
};
export const clearHistory = async () => {
  try {
    const response = await axios.post(`${API_URL}/clear_history`);
    return response.data;
  } catch (error) {
    console.error("Error clearing history:", error);
    return { error: "Failed to clear history" };
  }
};
