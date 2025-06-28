import { MetaSummaryService } from '@/lib/research/meta-summary';
import { EuropePMCMetaAnalysis } from '@/lib/research/europepmc';

describe('Core Pathophysiology Extraction', () => {
  let metaSummaryService: MetaSummaryService;

  beforeEach(() => {
    metaSummaryService = new MetaSummaryService();
  });

  describe('Pathophysiology Knowledge Base', () => {
    it('should extract pathophysiology for lupus nephritis', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-1',
        title: 'Lupus nephritis treatment meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on lupus nephritis treatment outcomes',
        picos: {
          population: 'patients with lupus nephritis',
          intervention: 'immunosuppressive therapy',
          comparator: 'standard care',
          outcome: 'renal function improvement'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.plainLanguageSummary).toContain('immune complex deposition');
      expect(summary.plainLanguageSummary).toContain('glomeruli');
      expect(summary.plainLanguageSummary).toContain('autoantibodies');
    });

    it('should extract pathophysiology for diabetes', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-2',
        title: 'Diabetes management meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on diabetes management outcomes',
        picos: {
          population: 'patients with diabetes',
          intervention: 'insulin therapy',
          comparator: 'oral medications',
          outcome: 'glycemic control'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.plainLanguageSummary).toContain('hyperglycemia');
      expect(summary.plainLanguageSummary).toContain('insulin');
    });

    it('should handle unknown conditions gracefully', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-3',
        title: 'Rare disease treatment meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on rare disease treatment outcomes',
        picos: {
          population: 'patients with rare genetic disorder',
          intervention: 'experimental therapy',
          comparator: 'standard care',
          outcome: 'symptom improvement'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      // Should not crash and should provide basic summary
      expect(summary.plainLanguageSummary).toBeDefined();
      expect(summary.plainLanguageSummary.length).toBeGreaterThan(0);
    });
  });

  describe('Pathophysiology Integration', () => {
    it('should include pathophysiology in structured summary', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-4',
        title: 'Hypertension treatment meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on hypertension treatment outcomes',
        picos: {
          population: 'patients with hypertension',
          intervention: 'ACE inhibitors',
          comparator: 'placebo',
          outcome: 'blood pressure reduction'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.structuredSummary.population).toBe('patients with hypertension');
      expect(summary.structuredSummary.intervention).toBe('ACE inhibitors');
      expect(summary.structuredSummary.comparator).toBe('placebo');
    });

    it('should handle missing PICOS data', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-5',
        title: 'Treatment meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on treatment outcomes'
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.structuredSummary.population).toBe('Not specified');
      expect(summary.structuredSummary.intervention).toBe('Not specified');
      expect(summary.structuredSummary.comparator).toBe('Not specified');
    });
  });
});
