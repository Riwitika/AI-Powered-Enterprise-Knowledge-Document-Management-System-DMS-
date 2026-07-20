export type AIProvider = 'mock' | 'openai' | 'gemini' | 'claude' | 'azure';

export interface DocumentContext {
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
}

export interface AIResponse {
  answer: string;
  provider: AIProvider;
  timestamp: Date;
  suggestedNextPrompts?: string[];
}

class AIService {
  private currentProvider: AIProvider = 'mock';

  setProvider(provider: AIProvider) {
    this.currentProvider = provider;
  }

  getProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Generates a context-aware mock answer based on the query and document context.
   */
  private generateMockResponse(question: string, context?: DocumentContext): string {
    const q = question.toLowerCase();
    const title = context?.title || 'Active Document';
    const selected = context?.selectedText || '';

    // Quick Action: Summarize
    if (q.includes('summarize') || q.includes('summary')) {
      if (selected) {
        return `### Summary of Selected Section
The highlighted passage outlines the key operational scope of **${title}**. It emphasizes strict compliance protocols, resource allocation parameters, and the primary responsibilities of stakeholders.`;
      }
      return `### Executive Summary: ${title}
This **${context?.fileType || 'DOCX'}** document represents an enterprise-grade record owned by **${context?.owner || 'KMS Owner'}** (${context?.department || 'Operations'} Department). 

**Key Takeaways:**
1. **Scope & Objectives**: Addresses primary strategic objectives and implementation workflows.
2. **Key Allocations**: Directs primary resources and establishes operational standards.
3. **Next Steps**: Requires stakeholder validation, audit alignment, and compliance sign-offs.`;
    }

    // Quick Action: Explain
    if (q.includes('explain') || q.includes('meaning') || q.includes('what is')) {
      const targetText = selected || title;
      return `### Explanation: "${targetText.length > 40 ? targetText.substring(0, 40) + '...' : targetText}"
This section refers to standard operational guidelines within **${context?.department || 'Fast Trade Technologies'}**. It lays down structural constraints, technical definitions, and operational dependencies required to ensure compliance under version **${context?.version || 'v1.0'}**.`;
    }

    // Quick Action: Risks
    if (q.includes('risk') || q.includes('danger') || q.includes('vulnerability')) {
      return `### Risk Assessment: ${title}
I have scanned the document context for potential compliance, operational, and financial risks:

1. **Timeline Constraints (Medium Risk)**: Delivery dates are strictly structured; missing milestones could trigger resource variance.
2. **Access Control (Low Risk)**: Restricted to **${context?.department || 'Authorized Users'}**. Ensure sharing configurations are correctly reviewed.
3. **Technical Integrity (Low Risk)**: Documentation requires final engineering validation to ensure structural specifications meet standard guidelines.`;
    }

    // Quick Action: Deadlines
    if (q.includes('deadline') || q.includes('timeline') || q.includes('due date') || q.includes('when')) {
      return `### Deadlines & Milestones in ${title}
Here are the timelines extracted from the current document context:
* **Initial Audit Milestone**: Scheduled within 15 days of document instantiation.
* **Stakeholder Sign-off**: Required prior to major release cycles or version upgrade.
* **Final SOW Delivery**: Tied directly to contract activation protocols.`;
    }

    // Quick Action: Rewrite / Professional
    if (q.includes('rewrite') || q.includes('improve') || q.includes('tone') || q.includes('professionally')) {
      const textToRewrite = selected || "Fast Trade Enterprise Knowledge Management System enables unified data structures.";
      return `### Professionally Rewritten Section
> "${textToRewrite}"
   
**Revised Draft:**
"The Fast Trade Enterprise Knowledge and Document Management System provides a unified, highly optimized framework for document organization, access controls, and compliance monitoring across all corporate divisions."`;
    }

    // Quick Action: Convert to Table
    if (q.includes('table') || q.includes('tabular')) {
      return `### Structured Data Table

| Category | Description | Status |
| :--- | :--- | :--- |
| **Document** | ${title} | Active |
| **Owner** | ${context?.owner || 'Unspecified'} | Verified |
| **Department** | ${context?.department || 'General'} | Assigned |
| **Version** | ${context?.version || 'v1.0'} | Current |
| **Security** | Restricted | Monitored |`;
    }

    // Quick Action: Convert to Bullets / Action Items
    if (q.includes('bullet') || q.includes('action item') || q.includes('decision') || q.includes('checklist')) {
      return `### Action Items & Decisions
Based on **${title}**, here is the actionable checklist:
* [ ] **Review Specifications**: Validate technical and financial parameters.
* [ ] **Publish Draft**: Secure departmental approval for version **${context?.version || 'v1.0'}**.
* [ ] **Assign Tasks**: Set up milestones for engineering and legal teams.`;
    }

    // Quick Action: Translation
    if (q.includes('translate') || q.includes('spanish') || q.includes('french') || q.includes('german')) {
      return `### Translation (Spanish)
"Este documento representa el registro oficial de la empresa **${context?.department || 'Fast Trade'}**. La información confidencial contenida está protegida por políticas internas y normas de seguridad."`;
    }

    // Default conversational response
    return `### AI Document Assistant Response
I have analyzed the current document context:
* **Title**: ${title}
* **Format**: ${context?.fileType || 'Unspecified'}
* **Department**: ${context?.department || 'General'}
* **Version**: ${context?.version || 'v1.0'}

**Response to your query:**
"${question}"

Please let me know if you would like me to rewrite sections, extract tables, list action checklists, or translate parts of this document.`;
  }

  /**
   * Primary entry point for AI queries.
   */
  async ask(question: string, options: AIRequestOptions = {}): Promise<AIResponse> {
    const provider = options.provider || this.currentProvider;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (provider === 'mock') {
      const answer = this.generateMockResponse(question, options.documentContext);
      return {
        answer,
        provider: 'mock',
        timestamp: new Date(),
        suggestedNextPrompts: [
          'Summarize this document',
          'Extract key action items',
          'Are there any risks here?',
          'Convert this to a structured table'
        ]
      };
    }

    // Placeholders for real future API providers (OpenAI, Gemini, Anthropic)
    // When connecting in the future, these can invoke actual REST/SDK client methods.
    try {
      console.log(`Connecting to provider: ${provider}...`);
      // Fallback to mock for UI/UX testing scope
      const answer = this.generateMockResponse(question, options.documentContext);
      return {
        answer,
        provider,
        timestamp: new Date()
      };
    } catch (e) {
      throw new Error(`AI generation failed on provider ${provider}: ${(e as Error).message}`);
    }
  }
}

export const aiService = new AIService();
