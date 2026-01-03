import { useState, useEffect } from 'react';
import { Send, ListTodo, Sparkles, Clock } from 'lucide-react';
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
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'bot', text: 'こんにちは！今日のタスクについて何かお手伝いしましょうか？' }]);
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
        { id: '1', name: '助成金の申請 (モック)', due: '2026-05-01', listId: '1' },
        { id: '2', name: '月次レポート作成 (モック)', due: '2026-05-05', listId: '1' }
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
    <main className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8 font-sans relative overflow-hidden">
      {/* Left: Chat Interface */}
      <section className="w-1/2 relative flex flex-col p-6 overflow-hidden">
        <header className="flex items-center gap-3 mb-6 z-10">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AI Mentor</h1>
            <p className="text-sm text-gray-500">あなたの専属コーチ</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 px-2 no-scrollbar z-10 pb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm backdrop-blur-sm ${m.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-white/80 text-gray-800 border border-white/50 rounded-bl-none'
                }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white/50 px-4 py-2 rounded-full text-sm text-gray-500 border border-white/30">
                考え中...
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 z-10 glass-panel rounded-2xl p-2 flex items-center gap-2">
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-gray-700 placeholder-gray-400"
            placeholder="メッセージを入力..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Soft Background Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl -z-0 pointer-events-none" />
      </section>

      {/* Right: Task Board */}
      <section className="w-1/2 p-6 flex flex-col z-10">
        <div className="glass-panel h-full rounded-[2.5rem] p-8 flex flex-col overflow-hidden relative">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-800 z-10">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ListTodo className="w-5 h-5 text-orange-500" />
            </div>
            現在のタスク
          </h2>

          <div className="space-y-3 overflow-y-auto flex-1 z-10 pr-2">
            {tasks.map(task => (
              <div key={task.id} className="group glass-card rounded-2xl p-4 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-semibold text-gray-800">{task.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(task.due).toLocaleDateString('ja-JP')}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">進行中</span>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative decorative blob */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl -z-0 pointer-events-none" />
        </div>
      </section>
    </main>
  );
}

export default App;
