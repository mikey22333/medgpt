import { NextRequest } from 'next/server';
import { POST } from '@/app/api/research/route';

// Mock the research clients
jest.mock('@/lib/research/pubmed', () => ({
  PubMedClient: jest.fn().mockImplementation(() => ({
    searchArticles: jest.fn()
  }))
}));

jest.mock('@/lib/research/semantic-scholar', () => ({
  SemanticScholarClient: jest.fn().mockImplementation(() => ({
    searchPapers: jest.fn()
  }))
}));

jest.mock('@/lib/research/crossref', () => ({
  crossRefAPI: {
    searchMedicalResearch: jest.fn()
  },
  medicalResearchHelpers: {}
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnValue({ error: null }),
      select: jest.fn().mockReturnValue({ data: [], error: null }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    }))
  }))
}));

describe('/api/research route', () => {
  const mockPubMedClient = require('@/lib/research/pubmed').PubMedClient;
  const mockSemanticScholarClient = require('@/lib/research/semantic-scholar').SemanticScholarClient;
  const mockCrossRefAPI = require('@/lib/research/crossref').crossRefAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.PUBMED_API_KEY = 'test-key';
    process.env.SEMANTIC_SCHOLAR_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Chat-style requests', () => {
    it('should handle research mode chat requests', async () => {
      // Mock successful PubMed response
      const mockPubMedArticles = [
        {
          pmid: '123',
          title: 'Test Medical Paper',
          abstract: 'Test abstract',
          authors: ['Dr. Smith'],
          journal: 'Medical Journal',
          publishedDate: '2023-01-01',
          url: 'https://pubmed.ncbi.nlm.nih.gov/123'
        }
      ];

      // Mock successful CrossRef response
      const mockCrossRefPapers = [
        {
          DOI: '10.1234/test',
          title: ['CrossRef Test Paper'],
          author: [{ given: 'John', family: 'Doe' }],
          'container-title': ['Test Journal'],
          published: { 'date-parts': [[2023, 1, 1]] },
          URL: 'https://doi.org/10.1234/test',
          abstract: 'CrossRef abstract'
        }
      ];

      mockPubMedClient.prototype.searchArticles.mockResolvedValue(mockPubMedArticles);
      mockCrossRefAPI.searchMedicalResearch.mockResolvedValue(mockCrossRefPapers);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'diabetes treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('citations');
      expect(data.citations).toHaveLength(2); // PubMed + CrossRef
    });

    it('should handle empty query gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: '',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Query is required');
    });

    it('should handle missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'diabetes'
          // Missing sessionId and mode
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle PubMed API errors gracefully', async () => {
      mockPubMedClient.prototype.searchArticles.mockRejectedValue(new Error('PubMed API Error'));
      mockCrossRefAPI.searchMedicalResearch.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'diabetes treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('response');
      // Should still work with CrossRef results
    });

    it('should handle CrossRef API errors gracefully', async () => {
      mockPubMedClient.prototype.searchArticles.mockResolvedValue([]);
      mockCrossRefAPI.searchMedicalResearch.mockRejectedValue(new Error('CrossRef API Error'));

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'diabetes treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('response');
      // Should still work with PubMed results
    });
  });

  describe('Research query requests', () => {
    it('should handle source-specific research queries', async () => {
      const mockPubMedArticles = [
        {
          pmid: '456',
          title: 'Another Medical Paper',
          abstract: 'Another test abstract',
          authors: ['Dr. Johnson'],
          journal: 'Another Medical Journal',
          publishedDate: '2023-02-01',
          url: 'https://pubmed.ncbi.nlm.nih.gov/456'
        }
      ];

      mockPubMedClient.prototype.searchArticles.mockResolvedValue(mockPubMedArticles);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'cardiovascular disease',
          source: 'pubmed',
          maxResults: 10
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('papers');
      expect(data.papers).toHaveLength(1);
      expect(data.papers[0].pmid).toBe('456');
    });

    it('should handle semantic scholar queries', async () => {
      const mockSemanticPapers = [
        {
          paperId: 'ss123',
          title: 'Semantic Scholar Paper',
          abstract: 'Semantic Scholar abstract',
          authors: [{ name: 'Dr. Wilson' }],
          venue: 'Semantic Journal',
          year: 2023,
          url: 'https://semanticscholar.org/paper/ss123'
        }
      ];

      mockSemanticScholarClient.prototype.searchPapers.mockResolvedValue(mockSemanticPapers);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'machine learning in medicine',
          source: 'semantic-scholar',
          maxResults: 5
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('papers');
      expect(data.papers).toHaveLength(1);
    });

    it('should validate maxResults parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
          source: 'pubmed',
          maxResults: 1000 // Too high
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('maxResults');
    });

    it('should handle invalid source parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
          source: 'invalid-source',
          maxResults: 10
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('source');
    });
  });

  describe('Evidence grading and analysis', () => {
    it('should include evidence grading in responses', async () => {
      const mockPubMedArticles = [
        {
          pmid: '789',
          title: 'Randomized Controlled Trial of Diabetes Treatment',
          abstract: 'A randomized controlled trial studying the efficacy of metformin in type 2 diabetes patients.',
          authors: ['Dr. Expert'],
          journal: 'New England Journal of Medicine',
          publishedDate: '2023-03-01',
          url: 'https://pubmed.ncbi.nlm.nih.gov/789'
        }
      ];

      mockPubMedClient.prototype.searchArticles.mockResolvedValue(mockPubMedArticles);
      mockCrossRefAPI.searchMedicalResearch.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'metformin diabetes treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toContain('Evidence Quality');
      expect(data.citations[0]).toHaveProperty('evidenceGrade');
      expect(data.citations[0]).toHaveProperty('confidenceScore');
    });

    it('should filter out non-biomedical papers', async () => {
      const mockMixedPapers = [
        {
          pmid: '100',
          title: 'Medical Research on Heart Disease',
          abstract: 'Clinical study on cardiovascular disease treatment.',
          authors: ['Dr. Cardiologist'],
          journal: 'Cardiology Journal',
          publishedDate: '2023-01-01',
          url: 'https://pubmed.ncbi.nlm.nih.gov/100'
        }
      ];

      const mockNonMedicalCrossRef = [
        {
          DOI: '10.1000/nonmed',
          title: ['Computer Algorithm Optimization'],
          author: [{ given: 'John', family: 'Engineer' }],
          'container-title': ['Computer Science Journal'],
          published: { 'date-parts': [[2023, 1, 1]] },
          abstract: 'Novel algorithms for data processing.'
        }
      ];

      mockPubMedClient.prototype.searchArticles.mockResolvedValue(mockMixedPapers);
      mockCrossRefAPI.searchMedicalResearch.mockResolvedValue(mockNonMedicalCrossRef);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'heart disease treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should include the medical paper but filter out the computer science paper
      expect(data.citations.length).toBe(1);
      expect(data.citations[0].title).toContain('Heart Disease');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle missing environment variables gracefully', async () => {
      delete process.env.PUBMED_API_KEY;
      delete process.env.SEMANTIC_SCHOLAR_API_KEY;

      mockPubMedClient.prototype.searchArticles.mockResolvedValue([]);
      mockCrossRefAPI.searchMedicalResearch.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'diabetes treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Should still work without API keys
      const data = await response.json();
      expect(data).toHaveProperty('response');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockSupabase = require('@/lib/supabase/server').createClient;
      mockSupabase.mockReturnValue({
        from: jest.fn(() => ({
          insert: jest.fn().mockReturnValue({ error: 'Database error' }),
          select: jest.fn().mockReturnValue({ data: [], error: null })
        }))
      });

      mockPubMedClient.prototype.searchArticles.mockResolvedValue([]);
      mockCrossRefAPI.searchMedicalResearch.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'diabetes treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Should continue working despite database error
      const data = await response.json();
      expect(data).toHaveProperty('response');
    });
  });

  describe('Rate limiting and optimization', () => {
    it('should limit results for chat requests', async () => {
      const mockManyPapers = Array.from({ length: 20 }, (_, i) => ({
        pmid: `${i}`,
        title: `Paper ${i}`,
        abstract: `Abstract ${i}`,
        authors: [`Author ${i}`],
        journal: `Journal ${i}`,
        publishedDate: '2023-01-01',
        url: `https://pubmed.ncbi.nlm.nih.gov/${i}`
      }));

      mockPubMedClient.prototype.searchArticles.mockResolvedValue(mockManyPapers);
      mockCrossRefAPI.searchMedicalResearch.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/research', {
        method: 'POST',
        body: JSON.stringify({
          query: 'diabetes treatment',
          sessionId: 'test-session',
          mode: 'research'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should limit citations for chat mode
      expect(data.citations.length).toBeLessThanOrEqual(6); // maxResults for chat mode
    });
  });
});
