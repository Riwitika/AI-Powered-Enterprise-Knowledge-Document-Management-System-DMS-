import { api } from '../api/client';

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'azure';

export interface DocumentContext {
  id?: string;
  title: string;
  fileType: string;
  department?: string;
  owner?: string;
  tags?: string[];
  version?: string;
  selectedText?: string;
  fullContent?: string;
}

export interface AIRequestOptions {
  provider?: AIProvider;
  documentContext?: DocumentContext;
  history?: { role: 'user' | 'assistant'; content: string }[];
  mode?: 'repository' | 'document';
}

export interface AIResponse {
  answer: string;
  provider: AIProvider;
  timestamp: Date;
  suggestedNextPrompts?: string[];
  sourceDocuments?: any[];
}

class AIService {
  private currentProvider: AIProvider = 'openai';

  setProvider(provider: AIProvider) {
    this.currentProvider = provider;
  }

  getProvider(): AIProvider {
    return this.currentProvider;
  }

  async ask(question: string, options: AIRequestOptions = {}): Promise<AIResponse> {
    const docId = options.documentContext?.id;
    const isRealUUID = !!docId && !docId.startsWith('doc-') && !docId.startsWith('temp-') && docId.length > 20;

    if (options.mode === 'document' && isRealUUID && docId) {
      try {
        const res = await api.ai.askDoc(docId, question);
        return {
          answer: res.answer,
          provider: 'openai',
          timestamp: new Date(),
          sourceDocuments: res.source_documents,
          suggestedNextPrompts: [
            'Summarize this document',
            'Extract key action items',
            'Are there any risks here?'
          ]
        };
      } catch (err) {
        console.error('Document-scoped ask failed:', err);
        throw err;
      }
    }

    // Default global ask (when no doc open, or fallback if not real UUID)
    try {
      const res = await api.ai.ask(question);
      return {
        answer: res.answer,
        provider: 'openai',
        timestamp: new Date(),
        sourceDocuments: res.source_documents,
        suggestedNextPrompts: [
          'What are the budget highlights?',
          'List company guidelines',
          'Search latest reports'
        ]
      };
    } catch (err) {
      console.error('Backend global ask failed:', err);
      throw err;
    }
  }
}

export const aiService = new AIService();
