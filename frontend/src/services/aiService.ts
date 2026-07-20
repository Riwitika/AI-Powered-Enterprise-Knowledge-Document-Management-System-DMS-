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
  mode?: 'repository' | 'document';
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
   * Generates a context-aware mock answer based on the query, history, and document context.
   */
  private generateMockResponse(
    question: string, 
    context?: DocumentContext, 
    history?: { role: 'user' | 'assistant'; content: string }[],
    mode: 'repository' | 'document' = 'repository'
  ): string {
    const q = question.toLowerCase().trim();
    const title = context?.title || 'Active Document';
    const selected = context?.selectedText || '';

    // 1. CONVERSATION MEMORY LAYER (Checks if question is a follow-up query)
    const hasHistory = history && history.length > 1; // 1 is welcome message
    const lastAssistantMsg = hasHistory 
      ? history.slice().reverse().find(m => m.role === 'assistant')?.content 
      : null;

    if (hasHistory && lastAssistantMsg) {
      if (q.includes('shorter') || q.includes('shorten') || q.includes('less text') || q.includes('condense')) {
        return `### Shortened Version
Here is the condensed key take-away from the previous response:
* **Summary**: The primary operational objective focuses on resource audit schedules, compliance standards alignment, and budget variance controls (+/-3%).`;
      }
      if (q.includes('longer') || q.includes('expand') || q.includes('elaborate') || q.includes('more detail')) {
        return `### Expanded Detail
Here is the elaborated breakdown based on our previous discussion:
1. **Timeline Constraints**: Audit validations are strictly structured within 15 days of draft finalization.
2. **Resource Strategy**: Accessories and logistics allocations will see optimized margins starting Q3.
3. **Internal Governance**: Audit registers will expand scope to include vendor SOW agreements.`;
      }
      if (q.includes('translate') || q.includes('spanish') || q.includes('french')) {
        return `### Spanish Translation
"Aquí está la traducción de nuestra respuesta anterior: El objetivo operativo principal se centra en la programación de auditorías de recursos y el cumplimiento de las normativas vigentes."`;
      }
    }

    // 2. REPOSITORY ASSISTANT MODE COMMANDS (When no document is open, or on documents page)
    if (mode === 'repository' || title === 'General Workspace') {
      // Find Finance Policies
      if (q.includes('finance policies') || q.includes('find finance')) {
        return `### Repository Search Results: "Finance Policies"
Found **2 matches** in your department directory:
1. [Finance Audit Guideline.docx](file:///02_Finance/Guidelines) (Version 1.2, Owner: Paras Jain)
2. [Q2 Budget Report.docx](file:///02_Finance/Reports) (Version 2.1, Owner: Paras Jain)

Would you like me to open or summarize one of these files?`;
      }
      // Open latest invoice
      if (q.includes('invoice') || q.includes('open invoice')) {
        return `### File Retrieved: Invoice_FT_2026_089.xlsx
* **Location**: \`/02_Finance/Invoices/Invoice_FT_2026_089.xlsx\`
* **Owner**: Yukti Gupta
* **Amount**: $12,450.00
* **Status**: Pending approval from Finance Team

*Let me know if you would like me to trigger an approval request note.*`;
      }
      // Show HR templates
      if (q.includes('hr template') || q.includes('show hr')) {
        return `### HR Document Blueprints
Here are the available HR templates ready in the KMS catalog:
* [Employee Onboarding SOP](file:///Templates/sop) - Standard training checklist.
* [Standard NDA Blueprint](file:///Templates/nda) - Mutual non-disclosure agreement.
* [HR Policy Manual Outline](file:///Templates/hr-policy) - Workplace guidelines.

*Click on the "Templates" library button in the Catalog view to instantiate these.*`;
      }
      // Locate Project Proposal
      if (q.includes('locate project') || q.includes('project proposal')) {
        return `### File Located: Project Proposal Outline.docx
* **File Name**: Project Proposal Outline.docx
* **Directory**: \`/00_Company_Information/Proposals\`
* **Last Modified**: Yesterday, 04:15 PM by Paras Jain
* **Access Level**: Corporate Wide (Can View / Edit)`;
      }
      // Generate Quarterly Report
      if (q.includes('generate quarterly') || q.includes('quarterly report')) {
        return `### Generated Draft: Q2 Quarterly Business Report
*Saved draft in \`/02_Finance/Reports/Q2_Quarterly_Business_Report_Draft.docx\`*

**1. Executive Metrics Summary:**
* **Revenue**: +14.2% QoQ growth.
* **Storage Allocation**: 24.5% utilized.
* **Audit compliance**: 100% verified.

Would you like me to populate this outline into a new blank document?`;
      }
      // Create Meeting Minutes
      if (q.includes('create meeting') || q.includes('meeting minutes')) {
        return `### Drafted Blueprint: Meeting Minutes
*Saved outline in \`/Templates/Meeting_Minutes_Sync.docx\`*

**Details:**
* **Meeting Topic**: Project Alignment Sync
* **Facilitator**: Arnim Goyal
* **Attendees**: Arun Goyal, Arnim Goyal, Riwitika Gupta, Paras Jain

Would you like to import this outline into the active editor canvas?`;
      }
      // Find documents shared with me
      if (q.includes('shared with me') || q.includes('shared')) {
        return `### Shared Documents Index
Here are documents shared with you recently:
1. **Vendor Agreement.pdf** (Shared by Riwitika Gupta, HR Operations Dept)
2. **Competitor Analysis.xlsx** (Shared by Yukti Gupta, HR Operations Dept)
3. **Q2 Budget Report.docx** (Shared by Paras Jain, Finance Dept)`;
      }
      // Summarize this folder
      if (q.includes('summarize this folder') || q.includes('folder summary')) {
        return `### Folder Summary: /02_Finance/Reports
Contains **3 active documents** (Q2 Budget, Sales April, Audit Guidelines):
* **Key Variance**: Expenditures are within predicted +/-3% margins.
* **Compliance status**: All versions verified.
* **Owner**: Paras Jain / Uttam Gupta.`;
      }
      // General repository searches
      if (q.includes('find') || q.includes('locate') || q.includes('search') || q.includes('show')) {
        return `### Repository Search Results
Found **3 matches** matching your search in the workspace directory:
* **Q2 Budget Report.docx** (Finance Division)
* **Vendor Agreement.pdf** (Legal Department)
* **Product Roadmap.pptx** (Product Team)`;
      }

      // Default Repository mode conversational response
      return `### Repository Assistant Mode
Hello! I am acting as your **KMS Repository Assistant**. How can I help you search or locate files in the workspace today?
* *Try commands like:* "Find Finance Policies", "Show HR templates", "Locate Project Proposal", or "Find documents shared with me".`;
    }

    // 3. DOCUMENT ASSISTANT MODE (When document is open in editor)
    // Selected Text actions
    if (selected) {
      if (q.includes('rewrite')) {
        return `### Professionally Rewritten Selected Section
> "${selected.length > 50 ? selected.substring(0, 50) + '...' : selected}"

**Revised Draft:**
"The Fast Trade DMS framework provides a unified, optimized architecture for corporate data organization and compliance monitoring across all corporate divisions."`;
      }
      if (q.includes('explain')) {
        return `### Explanation: "${selected.length > 40 ? selected.substring(0, 40) + '...' : selected}"
This section refers to standard operational guidelines within **${context?.department || 'Fast Trade Technologies'}**. It lays down structural constraints, technical definitions, and operational dependencies required to ensure compliance under version **${context?.version || 'v1.0'}**.`;
      }
      if (q.includes('summarize')) {
        return `### Summary of Highlighted Section
The selected passage highlights strict compliance protocols, resource allocation parameters, and key timelines required by stakeholders.`;
      }
      if (q.includes('improve')) {
        return `### Grammar & Tone Improvement
> "${selected}"

**Refined Draft:**
"We recommend establishing continuous performance monitors to track cost variances and optimize project timelines."`;
      }
      if (q.includes('translate')) {
        return `### Spanish Translation (Selection)
"Este segmento representa el registro oficial de la empresa **${context?.department || 'Fast Trade'}**. La información confidencial contenida está protegida por políticas internas."`;
      }
    }

    // Full document actions
    if (q.includes('summarize') || q.includes('summary')) {
      return `### Executive Summary: ${title}
This **${context?.fileType || 'DOCX'}** document represents an enterprise-grade record owned by **${context?.owner || 'KMS Owner'}** (${context?.department || 'Operations'} Department). 

**Key Takeaways:**
1. **Scope & Objectives**: Addresses primary strategic objectives and implementation workflows.
2. **Key Allocations**: Directs primary resources and establishes operational standards.
3. **Next Steps**: Requires stakeholder validation, audit alignment, and compliance sign-offs.`;
    }
    if (q.includes('risk') || q.includes('danger') || q.includes('vulnerability')) {
      return `### Risk Assessment: ${title}
I have scanned the document context for potential compliance, operational, and financial risks:

1. **Timeline Constraints (Medium Risk)**: Delivery dates are strictly structured; missing milestones could trigger resource variance.
2. **Access Control (Low Risk)**: Restricted to **${context?.department || 'Authorized Users'}**. Ensure sharing configurations are correctly reviewed.
3. **Technical Integrity (Low Risk)**: Documentation requires final engineering validation to ensure structural specifications meet standard guidelines.`;
    }
    if (q.includes('deadline') || q.includes('timeline') || q.includes('due date')) {
      return `### Deadlines & Milestones in ${title}
Here are the timelines extracted from the current document context:
* **Initial Audit Milestone**: Scheduled within 15 days of document instantiation.
* **Stakeholder Sign-off**: Required prior to major release cycles or version upgrade.
* **Final SOW Delivery**: Tied directly to contract activation protocols.`;
    }
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
    if (q.includes('rewrite') || q.includes('professional') || q.includes('improve')) {
      return `### Professionally Rewritten Section
> "Fast Trade Enterprise Knowledge Management System enables unified data structures."
   
**Revised Draft:**
"The Fast Trade Enterprise Knowledge and Document Management System provides a unified, highly optimized framework for document organization, access controls, and compliance monitoring across all corporate divisions."`;
    }
    if (q.includes('bullet') || q.includes('action item') || q.includes('decision') || q.includes('checklist')) {
      return `### Action Items & Decisions
Based on **${title}**, here is the actionable checklist:
* [ ] **Review Specifications**: Validate technical and financial parameters.
* [ ] **Publish Draft**: Secure departmental approval for version **${context?.version || 'v1.0'}**.
* [ ] **Assign Tasks**: Set up milestones for engineering and legal teams.`;
    }

    // Default Document mode conversational response
    return `### Document Assistant Mode
I have loaded document context for: **${title}** (${context?.fileType || 'DOCX'}). 
* **Department**: ${context?.department || 'General'}
* **Version**: ${context?.version || 'v1.0'}
* **Owner**: ${context?.owner || 'Unspecified'}

Ask me to summarize this document, review risks, rewrite highlights, or convert lists to tables.`;
  }

  /**
   * Primary entry point for AI queries.
   */
  async ask(question: string, options: AIRequestOptions = {}): Promise<AIResponse> {
    const provider = options.provider || this.currentProvider;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (provider === 'mock') {
      const answer = this.generateMockResponse(
        question, 
        options.documentContext,
        options.history,
        options.mode
      );
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
    try {
      console.log(`Connecting to provider: ${provider}...`);
      const answer = this.generateMockResponse(
        question, 
        options.documentContext,
        options.history,
        options.mode
      );
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
