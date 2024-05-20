"use client"

// pages/assistant.tsx

import React from 'react';
import { useState } from 'react';
import axios from 'axios';

const AssistantPage = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const result = await axios.post('/api/assistant', { prompt: input });
      setResponse(result.data.response);
    } catch (error) {
      console.error('Error fetching the assistant response:', error);
      setResponse('An error occurred while fetching the response.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>OpenAI Assistant</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          cols={50}
          placeholder="Enter your prompt here..."
          required
        />
        <br />
        <button type="submit">Get Response</button>
      </form>
      <div style={{ marginTop: '20px' }}>
        <h2>Response:</h2>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default AssistantPage;
