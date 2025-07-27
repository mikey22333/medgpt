<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# CliniSynth - Copilot Instructions

This is a Next.js 14 TypeScript project for CliniSynth, a free AI-powered medical research assistant website.

## Project Structure
- Uses Next.js App Router with TypeScript
- TailwindCSS for styling with shadcn/ui components
- Will integrate with local LLMs via Ollama
- Uses PubMed and Semantic Scholar APIs for research data
- Implements RAG (Retrieval Augmented Generation) for medical responses

## Key Guidelines
1. **Medical Context**: Always consider medical accuracy and include appropriate disclaimers
2. **Citation System**: Implement proper academic citation formatting for research papers
3. **Responsive Design**: Ensure mobile-friendly chat interface
4. **Performance**: Optimize for fast API responses and streaming AI responses
5. **Safety**: Include medical disclaimers and input validation
6. **Accessibility**: Follow WCAG guidelines for healthcare applications

## Component Structure
- Use shadcn/ui components for consistent UI
- Follow React Server Components pattern where possible
- Implement proper error boundaries for API failures
- Use TypeScript strictly for all components and API routes

## API Integration
- PubMed Entrez API for medical research papers
- Semantic Scholar API as backup research source
- Implement proper rate limiting and error handling
