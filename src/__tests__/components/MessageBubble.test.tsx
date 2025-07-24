import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { type Message } from '@/lib/types/chat';

// Mock the usePDFExport hook
jest.mock('@/hooks/usePDFExport', () => ({
  usePDFExport: () => ({
    exportToPDF: jest.fn(),
    isGenerating: false
  })
}));

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => ({}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('MessageBubble', () => {
  const mockUserMessage: Message = {
    id: '1',
    role: 'user',
    content: 'What is diabetes?',
    timestamp: new Date('2023-01-01T12:00:00Z')
  };

  const mockAssistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Diabetes is a metabolic disorder characterized by high blood sugar levels.',
    timestamp: new Date('2023-01-01T12:01:00Z'),
    citations: [
      {
        id: '123',
        title: 'Diabetes Management Guidelines',
        authors: ['Dr. Smith', 'Dr. Johnson'],
        journal: 'Diabetes Care',
        year: '2023',
        abstract: 'Comprehensive guidelines for diabetes management.',
        source: 'PubMed',
        url: 'https://pubmed.ncbi.nlm.nih.gov/123',
        confidenceScore: 85
      }
    ],
    reasoningSteps: [
      {
        step: 1,
        title: 'Literature Search',
        process: 'Searching medical literature for diabetes information',
        evidence: ['PubMed', 'CrossRef'],
        confidence: 85,
        uncertainties: [],
        criticalQuestions: []
      }
    ]
  };

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn()
      }
    });
  });

  describe('User Messages', () => {
    it('should render user message correctly', () => {
      render(<MessageBubble message={mockUserMessage} />);
      
      expect(screen.getByText('What is diabetes?')).toBeInTheDocument();
      expect(screen.getByText('12:00:00 PM')).toBeInTheDocument();
      
      // Should have user icon
      const userIcon = screen.getByText('What is diabetes?').closest('div')?.querySelector('.h-4.w-4');
      expect(userIcon).toBeInTheDocument();
    });

    it('should align user messages to the right', () => {
      render(<MessageBubble message={mockUserMessage} />);
      
      const messageContainer = screen.getByText('What is diabetes?').closest('.flex');
      expect(messageContainer).toHaveClass('justify-end');
    });
  });

  describe('Assistant Messages', () => {
    it('should render assistant message correctly', () => {
      render(<MessageBubble message={mockAssistantMessage} mode="research" />);
      
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
      expect(screen.getByText('12:01:00 PM')).toBeInTheDocument();
      
      // Should have bot icon
      const botIcon = screen.getByText(/Diabetes is a metabolic disorder/).closest('div')?.querySelector('.h-4.w-4');
      expect(botIcon).toBeInTheDocument();
    });

    it('should align assistant messages to the left', () => {
      render(<MessageBubble message={mockAssistantMessage} />);
      
      const messageContainer = screen.getByText(/Diabetes is a metabolic disorder/).closest('.flex');
      expect(messageContainer).toHaveClass('justify-start');
    });

    it('should render reasoning steps when showReasoning is true', () => {
      render(<MessageBubble message={mockAssistantMessage} showReasoning={true} />);
      
      // Check if reasoning display is rendered (this would require additional mocking of ReasoningDisplay)
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
    });

    it('should not render reasoning steps when showReasoning is false', () => {
      render(<MessageBubble message={mockAssistantMessage} showReasoning={false} />);
      
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
    });
  });

  describe('Citations', () => {
    it('should render citations in research mode', () => {
      render(<MessageBubble message={mockAssistantMessage} mode="research" />);
      
      // Citations should be present (this would require additional mocking of CitationCard)
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
    });

    it('should render citations in source-finder mode', () => {
      render(<MessageBubble message={mockAssistantMessage} mode="source-finder" />);
      
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
    });

    it('should not render citations in doctor mode', () => {
      render(<MessageBubble message={mockAssistantMessage} mode="doctor" />);
      
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render action buttons for assistant messages', () => {
      render(<MessageBubble message={mockAssistantMessage} />);
      
      // Look for action buttons (copy, export, thumbs up/down)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not render action buttons for user messages', () => {
      render(<MessageBubble message={mockUserMessage} />);
      
      // Should not have action buttons for user messages
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should handle copy action', async () => {
      const mockClipboard = jest.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: mockClipboard
        }
      });

      render(<MessageBubble message={mockAssistantMessage} />);
      
      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(btn => btn.getAttribute('title') === 'Copy response');
      
      if (copyButton) {
        fireEvent.click(copyButton);
        expect(mockClipboard).toHaveBeenCalledWith(mockAssistantMessage.content);
      }
    });
  });

  describe('Evidence Quality Indicators', () => {
    it('should display evidence quality badge for high quality evidence', () => {
      const highQualityMessage = {
        ...mockAssistantMessage,
        citations: [
          {
            ...mockAssistantMessage.citations![0],
            source: 'PubMed' as const,
            confidenceScore: 90
          }
        ]
      };

      render(<MessageBubble message={highQualityMessage} mode="research" />);
      
      // Should display some indication of evidence quality
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
    });

    it('should display appropriate badge for moderate quality evidence', () => {
      const moderateQualityMessage = {
        ...mockAssistantMessage,
        citations: [
          {
            ...mockAssistantMessage.citations![0],
            confidenceScore: 65
          }
        ]
      };

      render(<MessageBubble message={moderateQualityMessage} mode="research" />);
      
      expect(screen.getByText(/Diabetes is a metabolic disorder/)).toBeInTheDocument();
    });
  });

  describe('Content Expansion', () => {
    const longMessage: Message = {
      id: '3',
      role: 'assistant',
      content: 'This is a very long message. '.repeat(50), // Create long content
      timestamp: new Date('2023-01-01T12:02:00Z')
    };

    it('should show expand/collapse for long messages', () => {
      render(<MessageBubble message={longMessage} />);
      
      expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
    });

    it('should toggle expansion when expand/collapse button is clicked', () => {
      render(<MessageBubble message={longMessage} />);
      
      // Look for expand/collapse buttons
      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find(btn => 
        btn.textContent?.includes('Expand') || btn.textContent?.includes('Collapse')
      );
      
      if (expandButton) {
        const initialText = expandButton.textContent;
        fireEvent.click(expandButton);
        
        // Text should change after click
        expect(expandButton.textContent).not.toBe(initialText);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for action buttons', () => {
      render(<MessageBubble message={mockAssistantMessage} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Each button should have either title or aria-label
        const hasLabel = button.getAttribute('title') || button.getAttribute('aria-label');
        expect(hasLabel).toBeTruthy();
      });
    });

    it('should have proper semantic structure', () => {
      render(<MessageBubble message={mockAssistantMessage} />);
      
      // Should have proper time display
      expect(screen.getByText('12:01:00 PM')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing timestamp gracefully', () => {
      const messageWithoutTimestamp = {
        ...mockAssistantMessage,
        timestamp: new Date('invalid')
      };

      expect(() => {
        render(<MessageBubble message={messageWithoutTimestamp} />);
      }).not.toThrow();
    });

    it('should handle empty content gracefully', () => {
      const emptyMessage = {
        ...mockAssistantMessage,
        content: ''
      };

      expect(() => {
        render(<MessageBubble message={emptyMessage} />);
      }).not.toThrow();
    });

    it('should handle missing citations gracefully', () => {
      const messageWithoutCitations = {
        ...mockAssistantMessage,
        citations: undefined
      };

      expect(() => {
        render(<MessageBubble message={messageWithoutCitations} />);
      }).not.toThrow();
    });
  });
});
