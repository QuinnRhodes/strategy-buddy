import OpenAI from 'openai';
import { getPdfContent } from './storage';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use a backend server
});

let threadId: string | null = null;

// Mock PDF content for each PDF (used as fallback)
const pdfContents: Record<string, string> = {
  '1': 'Market Analysis Report: Comprehensive analysis of current market trends, competitor positioning, and growth opportunities. Includes market size data, segmentation analysis, consumer behavior insights, and emerging trends that could impact strategic decision-making.',
  '2': 'Competitive Landscape Guide: Detailed profiles of key industry competitors with strengths and weaknesses analysis. Features competitive positioning maps, benchmark data on product offerings, pricing strategies, and market share information.',
  '3': 'Strategic Planning Template: Framework for developing comprehensive business strategies with sections on mission statement development, goal setting, action planning, resource allocation, and performance measurement. Includes examples of successful strategic initiatives.'
};

// Format the AI response with enhanced markdown
function formatAIResponse(text: string): string {
  // Add instructions to the AI to use proper markdown formatting
  const formattingPrompt = `
Please format your response with these guidelines:
- Use **bold text** for important points and key concepts
- Use proper markdown tables for structured data
- Use horizontal rules (---) between major sections
- Use headings (## and ###) to organize content
- Format code blocks and examples properly with \`\`\`
`;

  // Enhance the raw response with better formatting
  let enhancedText = text;
  
  // Ensure proper spacing around headings
  enhancedText = enhancedText.replace(/\n(#{1,3} .*)\n/g, '\n\n$1\n\n');
  
  // Add horizontal lines before each major section if not already present
  enhancedText = enhancedText.replace(/\n#{2} ([^\n]+)/g, '\n\n---\n\n## $1');
  
  // Ensure tables have proper spacing
  enhancedText = enhancedText.replace(/\n(\|[^\n]+\|)\n([^|])/g, '\n$1\n\n$2');
  
  // Improve list formatting
  enhancedText = enhancedText.replace(/\n- /g, '\n\n- ');
  
  return enhancedText;
}

export async function sendMessage(message: string, selectedPdfIds: string[] = []) {
  try {
    // Create a thread if we don't have one
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    // Add formatting instructions to the prompt
    let enhancedMessage = message + `\n\nPlease format your response with enhanced markdown:
- Use **bold** for important points and key terms
- Add clear section headings with ## or ###
- Use horizontal rules (---) between major sections
- Format tables properly for readability
- Separate paragraphs with blank lines`;
    
    if (selectedPdfIds.length > 0) {
      enhancedMessage += '\n\nConsider these documents in your response:\n';
      
      for (const id of selectedPdfIds) {
        // Check if we have the content in storage first
        const storedContent = getPdfContent(id);
        
        if (storedContent) {
          // For user-uploaded PDFs, use the content from storage
          enhancedMessage += `\n--- Document: ${id} ---\n${storedContent}\n`;
        } else if (pdfContents[id]) {
          // For pre-defined PDFs, use the mock content
          enhancedMessage += `\n--- Document: ${id} ---\n${pdfContents[id]}\n`;
        }
      }
    }

    // Add the message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: enhancedMessage
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
        // Format the response with enhanced markdown
        return formatAIResponse(textContent.text.value);
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