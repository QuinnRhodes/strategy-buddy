import OpenAI from 'openai';

console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY);
console.log('VITE_ASSISTANT_ID:', import.meta.env.VITE_ASSISTANT_ID);

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use a backend server
});

let threadId: string | null = null;

export async function sendMessage(message: string) {
  try {
    // Create a thread if we don't have one
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    // Add the message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    // Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: import.meta.env.VITE_ASSISTANT_ID
    });

    // Poll for the response
    let response = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (response.status === 'queued' || response.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      response = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (response.status === 'completed') {
      // Get the latest message from the thread
      const messages = await openai.beta.threads.messages.list(threadId);
      const latestMessage = messages.data[0];
      
      // Get the text content from the message
      const textContent = latestMessage.content.find(
        (c) => c.type === 'text'
      );

      if (textContent?.type === 'text') {
        return textContent.text.value;
      } else {
        return 'No text response available';
      }
    } else {
      throw new Error(`Run ended with status: ${response.status}`);
    }
  } catch (error: any) {
    if (error.response) {
      console.error('OpenAI API Error:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(`API Error: ${error.response.data?.error?.message || 'Unknown API error'}`);
    } else if (error.message) {
      console.error('OpenAI Client Error:', error.message);
      throw new Error(`Client Error: ${error.message}`);
    } else {
      console.error('Unknown Error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
}