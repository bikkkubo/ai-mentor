import { useState, useEffect } from 'react';
import { Send, ListTodo } from 'lucide-react';
import './index.css';

// Type definitions for google.script.run
declare const google: any;

interface Task {
  id: string;
  name: string;
  due: string;
  listId: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'bot', text: 'Hello! How can I help with your tasks today?' }]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch initial data
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler((data: any) => {
          setTasks(data.tasks || []);
        })
        .api_getData();
    } else {
      // Mock data for local dev
      setTasks([
        { id: '1', name: 'Mock Task 1', due: '2026-05-01', listId: '1' },
        { id: '2', name: 'Mock Task 2', due: '2026-05-05', listId: '1' }
      ]);
    }
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = { sender: 'user', text: input };
    setMessages([...messages, newMsg]);
    setInput('');
    setLoading(true);

    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler((resp: any) => {
          setMessages(prev => [...prev, { sender: 'bot', text: resp.text }]);
          setLoading(false);
        })
        .api_chat(input);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: "Echo: " + input }]);
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar / Task Board */}
      <div className="w-1/2 p-6 flex flex-col gap-4 overflow-y-auto border-r border-gray-200 bg-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-blue-600" />
          Task Board
        </h2>
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="p-4 rounded-lg border border-gray-200 shadow-sm bg-white hover:shadow-md transition cursor-pointer">
              <p className="font-medium text-gray-900">{task.name}</p>
              <p className="text-sm text-gray-500 mt-1">Due: {new Date(task.due).toLocaleDateString()}</p>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-gray-400 italic">No tasks found.</p>}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="w-1/2 flex flex-col bg-gray-50">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-gray-400 text-sm animate-pulse">Thinking...</div>}
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
