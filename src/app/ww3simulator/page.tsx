"use client";

import React, { useState } from 'react';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (content: string) => {
    setMessage(content);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: message }] }),
      });

      const data = await res.json();
      console.log(JSON.stringify(data, null, 2))
      setResponse(JSON.stringify(data.choices.message.content, null, 2));
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className = "flex justify-around" >
    <div>
      <h1>
        Full Data
      </h1>
      <div>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {response}
        </pre>
      </div>
    </div>
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Chat with OpenAI</h1>
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={message}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Send'}
          </button>
        </div>
        <pre className="mt-4 p-4 bg-white border border-gray-300 rounded-md overflow-auto">{response}</pre>
      </div>
    </div>
    </div>
  );
};

export default ChatPage;
