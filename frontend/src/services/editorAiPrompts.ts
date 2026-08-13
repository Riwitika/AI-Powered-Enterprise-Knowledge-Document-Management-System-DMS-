import { ApiError } from '../api/client';

export type EditorAiAction =
  | 'ask'
  | 'summarize'
  | 'explain'
  | 'improve'
  | 'shorter'
  | 'longer'
  | 'tone'
  | 'rewrite'
  | 'generate';

const ACTION_LABELS: Record<EditorAiAction, string> = {
  ask: 'Ask AI',
  summarize: 'Summarize',
  explain: 'Explain',
  improve: 'Improve writing',
  shorter: 'Make shorter',
  longer: 'Make longer',
  tone: 'Change tone (professional)',
  rewrite: 'Rewrite',
  generate: 'Generate content',
};

export function getEditorActionLabel(action: EditorAiAction): string {
  return ACTION_LABELS[action];
}

/**
 * Build a structured question for the existing document-scoped RAG endpoint.
 * Selected text is embedded in the prompt when applicable.
 */
export function buildEditorQuestion(
  action: EditorAiAction,
  userInput: string,
  selectedText?: string,
): string {
  const selection = selectedText?.trim() || '';

  switch (action) {
    case 'summarize':
      if (selection) {
        return `Summarize the following selected text concisely. Return only the summary:\n\n"${selection}"`;
      }
      return 'Summarize this document. Provide a concise overview of its main topics and purpose.';

    case 'explain':
      if (!selection) {
        return 'Explain the purpose and main points of this document in clear language.';
      }
      return `Explain the following selected text clearly and concisely:\n\n"${selection}"`;

    case 'improve':
      return `Improve the grammar, clarity, and writing quality of the following text. Return only the improved text without additional commentary:\n\n"${selection}"`;

    case 'shorter':
      return `Make the following text shorter while preserving the key meaning. Return only the shortened text:\n\n"${selection}"`;

    case 'longer':
      return `Expand the following text with more useful detail while staying accurate. Return only the expanded text:\n\n"${selection}"`;

    case 'tone':
      return `Rewrite the following text in a professional tone suitable for an enterprise document. Return only the rewritten text:\n\n"${selection}"`;

    case 'rewrite':
      return `Rewrite the following text while preserving its meaning. Return only the rewritten text:\n\n"${selection}"`;

    case 'generate':
      return `Generate document content based on this request. Return only the generated content without extra commentary:\n\n${userInput.trim()}`;

    case 'ask':
    default: {
      const question = userInput.trim();
      if (selection) {
        return `Regarding this selected passage from the document:\n"${selection}"\n\n${question}`;
      }
      return question;
    }
  }
}

export function requiresSelection(action: EditorAiAction): boolean {
  return ['improve', 'shorter', 'longer', 'tone', 'rewrite'].includes(action);
}

export function formatAiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'Your session expired. Please sign in again to use AI Document Assistant.';
    }
    if (err.status === 403) {
      return 'You do not have permission to use AI on this document.';
    }
    if (err.status === 404) {
      return 'Document not found. AI request could not be completed.';
    }
    if (err.status === 503) {
      return 'Cannot reach the backend server. Please verify the server is running.';
    }
    const detail = err.data?.detail ?? err.message;
    if (typeof detail === 'string') {
      if (/gemini|api key|not configured/i.test(detail)) {
        return 'AI is not configured on the server. GEMINI_API_KEY is missing or invalid.';
      }
      return detail;
    }
    return 'AI request failed. Please try again.';
  }

  if (err instanceof Error) {
    if (/network|fetch|failed/i.test(err.message)) {
      return 'Network error while contacting the AI service. Please try again.';
    }
    return err.message;
  }

  return 'AI request failed. Please try again.';
}

export function isAiUnavailableAnswer(answer: string): boolean {
  return (
    /AI generation service is temporarily unavailable/i.test(answer) ||
    /GEMINI_API_KEY is not set/i.test(answer) ||
    /AI is not configured/i.test(answer)
  );
}
