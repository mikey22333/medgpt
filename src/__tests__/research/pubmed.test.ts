import { PubMedClient } from '@/lib/research/pubmed';
import { type ResearchQuery, type PubMedArticle, type ResearchPaper } from '@/lib/types/research';

// Mock fetch globally
global.fetch = jest.fn();

describe('PubMedClient', () => {
  let pubmedClient: PubMedClient;

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    pubmedClient = new PubMedClient();
  });

  describe('searchArticles', () => {
    const mockPubMedSearchResponse = {
      esearchresult: {
        idlist: ['12345', '67890'],
        count: '2',
        retmax: '2'
      }
    };

    const mockPubMedSummaryResponse = {
      result: {
        '12345': {
          uid: '12345',
          title: 'Test Medical Paper',
          authors: [{ name: 'Smith J' }, { name: 'Doe A' }],
          source: 'J Med Test',
          pubdate: '2023/05/15',
          doi: '10.1234/test'
        },
        '67890': {
          uid: '67890',
          title: 'Another Medical Study',
          authors: [{ name: 'Johnson K' }],
          source: 'Med Journal',
          pubdate: '2022/03/10'
        }
      }
    };

    const mockPubMedAbstractResponse = `<?xml version="1.0" ?>
    <PubmedArticleSet>
      <PubmedArticle>
        <MedlineCitation>
          <PMID>12345</PMID>
          <Article>
            <ArticleTitle>Test Medical Paper</ArticleTitle>
            <Abstract>
              <AbstractText>This is a test abstract about diabetes treatment.</AbstractText>
            </Abstract>
          </Article>
        </MedlineCitation>
      </PubmedArticle>
      <PubmedArticle>
        <MedlineCitation>
          <PMID>67890</PMID>
          <Article>
            <ArticleTitle>Another Medical Study</ArticleTitle>
            <Abstract>
              <AbstractText>Study on cardiovascular effects.</AbstractText>
            </Abstract>
          </Article>
        </MedlineCitation>
      </PubmedArticle>
    </PubmedArticleSet>`;

    it('should search PubMed and return formatted articles', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPubMedSearchResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPubMedSummaryResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockPubMedAbstractResponse)
        });

      const query: ResearchQuery = {
        query: 'diabetes treatment',
        maxResults: 10,
        source: 'pubmed'
      };

      const results = await pubmedClient.searchArticles(query);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        pmid: '12345',
        title: expect.stringContaining('Test Medical Paper'),
        authors: expect.arrayContaining(['Smith J', 'Doe A']),
        journal: 'J Med Test'
      });
    });

    it('should handle empty search results', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          esearchresult: { idlist: [], count: '0', retmax: '0' }
        })
      });

      const query: ResearchQuery = {
        query: 'nonexistent medical term',
        maxResults: 5,
        source: 'pubmed'
      };

      const results = await pubmedClient.searchArticles(query);
      expect(results).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const query: ResearchQuery = {
        query: 'test query',
        maxResults: 5,
        source: 'pubmed'
      };

      await expect(pubmedClient.searchArticles(query)).rejects.toThrow('Failed to search PubMed articles');
    });

    it('should handle malformed API responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      const query: ResearchQuery = {
        query: 'test query',
        maxResults: 5,
        source: 'pubmed'
      };

      await expect(pubmedClient.searchArticles(query)).rejects.toThrow();
    });
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const client = new PubMedClient('test-api-key');
      expect(client).toBeInstanceOf(PubMedClient);
    });

    it('should initialize without API key', () => {
      const client = new PubMedClient();
      expect(client).toBeInstanceOf(PubMedClient);
    });
  });
});

describe('Research Paper Utility Functions', () => {
  describe('relevance scoring', () => {
    const mockPaper: ResearchPaper = {
      pmid: '1',
      title: 'Diabetes Treatment with Metformin',
      authors: ['Smith J'],
      journal: 'Diabetes Care',
      year: '2023',
      abstract: 'This study investigates the effectiveness of metformin in treating type 2 diabetes mellitus.',
      source: 'PubMed',
      url: 'https://pubmed.ncbi.nlm.nih.gov/1',
      relevanceScore: 0
    };

    it('should calculate relevance based on title and abstract matches', () => {
      // Mock a simple relevance calculation function
      const calculateRelevance = (paper: ResearchPaper, query: string): number => {
        const titleMatch = paper.title.toLowerCase().includes(query.toLowerCase()) ? 0.6 : 0;
        const abstractMatch = paper.abstract.toLowerCase().includes(query.toLowerCase()) ? 0.4 : 0;
        return Math.min(titleMatch + abstractMatch, 1.0);
      };

      const highRelevance = calculateRelevance(mockPaper, 'diabetes metformin');
      const lowRelevance = calculateRelevance(mockPaper, 'car repair');

      expect(highRelevance).toBeGreaterThan(0.5);
      expect(lowRelevance).toBe(0);
    });
  });

  describe('biomedical filtering', () => {
    const mockPapers: ResearchPaper[] = [
      {
        pmid: '1',
        title: 'Clinical Trial of Diabetes Treatment',
        authors: ['Smith J'],
        journal: 'New England Journal of Medicine',
        year: '2023',
        abstract: 'Randomized controlled trial studying diabetes treatment efficacy.',
        source: 'PubMed',
        url: 'https://pubmed.ncbi.nlm.nih.gov/1',
        relevanceScore: 0.9
      },
      {
        pmid: '2',
        title: 'Computer Science Algorithm Optimization',
        authors: ['Johnson K'],
        journal: 'IEEE Transactions',
        year: '2023',
        abstract: 'Novel algorithms for data processing and optimization.',
        source: 'CrossRef',
        url: 'https://doi.org/10.1000/test',
        relevanceScore: 0.1
      },
      {
        pmid: '3',
        title: 'Cardiovascular Effects of Exercise',
        authors: ['Brown L'],
        journal: 'Circulation',
        year: '2022',
        abstract: 'Study on exercise benefits for heart health.',
        source: 'PubMed',
        url: 'https://pubmed.ncbi.nlm.nih.gov/3',
        relevanceScore: 0.8
      }
    ];

    it('should filter papers based on biomedical relevance', () => {
      // Mock filtering function that checks for biomedical terms
      const filterBiomedical = (papers: ResearchPaper[], minRelevance = 0.3): ResearchPaper[] => {
        return papers.filter(paper => {
          const biomedicalTerms = ['clinical', 'medical', 'treatment', 'diabetes', 'cardiovascular', 'health'];
          const titleLower = paper.title.toLowerCase();
          const abstractLower = paper.abstract.toLowerCase();
          
          const hasBiomedicalTerms = biomedicalTerms.some(term => 
            titleLower.includes(term) || abstractLower.includes(term)
          );
          
          return hasBiomedicalTerms && (paper.relevanceScore || 0) >= minRelevance;
        }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      };

      const filtered = filterBiomedical(mockPapers);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p: ResearchPaper) => p.pmid)).toEqual(['1', '3']);
      expect(filtered.find((p: ResearchPaper) => p.title.includes('Computer Science'))).toBeUndefined();
    });

    it('should maintain relevance score ordering', () => {
      const sorted = [...mockPapers].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].relevanceScore || 0).toBeGreaterThanOrEqual(sorted[i + 1].relevanceScore || 0);
      }
    });

    it('should handle empty paper arrays', () => {
      const filterBiomedical = (papers: ResearchPaper[]): ResearchPaper[] => {
        return papers.filter(paper => paper.relevanceScore && paper.relevanceScore > 0.3);
      };

      const filtered = filterBiomedical([]);
      expect(filtered).toEqual([]);
    });
  });
});

describe('Integration Tests', () => {
  it('should simulate full research workflow', async () => {
    // Mock successful API responses
    const mockSearchResponse = {
      esearchresult: { idlist: ['123'], count: '1', retmax: '1' }
    };
    
    const mockSummaryResponse = {
      result: {
        '123': {
          uid: '123',
          title: 'Diabetes Management Guidelines',
          authors: [{ name: 'Expert A' }],
          source: 'Diabetes Care',
          pubdate: '2023/01/01'
        }
      }
    };
    
    const mockAbstractResponse = `<?xml version="1.0" ?>
    <PubmedArticleSet>
      <PubmedArticle>
        <MedlineCitation>
          <PMID>123</PMID>
          <Article>
            <ArticleTitle>Diabetes Management Guidelines</ArticleTitle>
            <Abstract>
              <AbstractText>Comprehensive guidelines for diabetes management.</AbstractText>
            </Abstract>
          </Article>
        </MedlineCitation>
      </PubmedArticle>
    </PubmedArticleSet>`;

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummaryResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockAbstractResponse)
      });

    const pubmedClient = new PubMedClient();
    const query: ResearchQuery = {
      query: 'diabetes management',
      maxResults: 5,
      source: 'pubmed'
    };

    const results = await pubmedClient.searchArticles(query);
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Diabetes Management Guidelines');
  });
});
