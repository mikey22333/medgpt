import { markdownToPlainText, exportToPDF, type PDFExportOptions } from '@/lib/utils/pdf-export';

describe('PDF Export Utils', () => {
  describe('markdownToPlainText', () => {
    it('should convert basic markdown to plain text', () => {
      const markdown = '# Title\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2';
      const result = markdownToPlainText(markdown);
      
      expect(result).toContain('Title');
      expect(result).toContain('Bold text and italic text');
      expect(result).toContain('List item 1');
      expect(result).toContain('List item 2');
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('*');
      expect(result).not.toContain('-');
    });

    it('should handle code blocks and inline code', () => {
      const markdown = 'Some `inline code` and:\n\n```javascript\nconst x = 1;\n```';
      const result = markdownToPlainText(markdown);
      
      expect(result).toContain('inline code');
      expect(result).toContain('const x = 1;');
      expect(result).not.toContain('`');
      expect(result).not.toContain('```');
      expect(result).not.toContain('javascript');
    });

    it('should handle links and images', () => {
      const markdown = '[Link text](http://example.com) and ![Alt text](image.jpg)';
      const result = markdownToPlainText(markdown);
      
      expect(result).toContain('Link text');
      expect(result).toContain('Alt text');
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
      expect(result).not.toContain('http://example.com');
      expect(result).not.toContain('image.jpg');
    });

    it('should handle tables', () => {
      const markdown = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
      const result = markdownToPlainText(markdown);
      
      expect(result).toContain('Header 1');
      expect(result).toContain('Header 2');
      expect(result).toContain('Cell 1');
      expect(result).toContain('Cell 2');
      expect(result).not.toContain('|');
      expect(result).not.toContain('-');
    });

    it('should handle blockquotes', () => {
      const markdown = '> This is a blockquote\n> with multiple lines';
      const result = markdownToPlainText(markdown);
      
      expect(result).toContain('This is a blockquote');
      expect(result).toContain('with multiple lines');
      expect(result).not.toContain('>');
    });

    it('should handle empty or undefined input', () => {
      expect(markdownToPlainText('')).toBe('');
      expect(markdownToPlainText(undefined as any)).toBe('');
      expect(markdownToPlainText(null as any)).toBe('');
    });

    it('should preserve line breaks appropriately', () => {
      const markdown = 'Line 1\n\nLine 2\n\nLine 3';
      const result = markdownToPlainText(markdown);
      
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
      // Should have some spacing between lines
      expect(result.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('exportToPDF', () => {
    const mockCitation = {
      id: '1',
      title: 'Test Paper',
      authors: ['Author 1', 'Author 2'],
      journal: 'Test Journal',
      year: 2023,
      abstract: 'This is a test abstract',
      url: 'http://example.com',
      source: 'pubmed' as const,
      relevanceScore: 0.9,
      evidenceGrade: 'A' as const
    };

    beforeEach(() => {
      // Mock jsPDF and its dependencies
      jest.clearAllMocks();
      
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'blob:test');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockElement = {
        href: '',
        download: '',
        click: jest.fn(),
        style: { display: '' }
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create PDF with research mode options', async () => {
      const options: PDFExportOptions = {
        mode: 'research',
        title: 'Test Research Export',
        query: 'diabetes treatment',
        papers: [mockCitation],
        content: 'Research content about diabetes'
      };

      const result = await exportToPDF(options);
      expect(result).toBe(true);
    });

    it('should create PDF with source mode options', async () => {
      const options: PDFExportOptions = {
        mode: 'source',
        title: 'Test Source Export',
        papers: [mockCitation],
        content: 'Source analysis content'
      };

      const result = await exportToPDF(options);
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock console.error to avoid test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock document.createElement to throw an error
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('Test error');
      });

      const options: PDFExportOptions = {
        mode: 'research',
        title: 'Test Export',
        papers: []
      };

      const result = await exportToPDF(options);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('PDF export failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});
