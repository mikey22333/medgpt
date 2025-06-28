import { MetaSummaryService } from '@/lib/research/meta-summary';
import { EuropePMCMetaAnalysis } from '@/lib/research/europepmc';

describe('Special Case Handling', () => {
  let metaSummaryService: MetaSummaryService;

  beforeEach(() => {
    metaSummaryService = new MetaSummaryService();
  });

  describe('Aspirin for Colorectal Cancer', () => {
    it('should trigger special case for aspirin and colorectal cancer', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-aspirin-1',
        title: 'Aspirin for colorectal cancer prevention meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on aspirin for colorectal cancer prevention',
        picos: {
          population: 'adults at risk for colorectal cancer',
          intervention: 'low-dose aspirin',
          comparator: 'placebo',
          outcome: 'colorectal cancer incidence'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.plainLanguageSummary).toContain('💊 **Aspirin and Colorectal Cancer**');
      expect(summary.plainLanguageSummary).toContain('Regular low-dose **aspirin** may reduce the long-term risk of **colorectal cancer**');
      expect(summary.plainLanguageSummary).toContain('However, the exact benefit varies by individual risk');
    });

    it('should trigger for case-insensitive aspirin and colorectal', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-aspirin-2',
        title: 'ASPIRIN for COLORECTAL cancer prevention',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on ASPIRIN for COLORECTAL cancer prevention',
        picos: {
          population: 'adults at risk for COLORECTAL cancer',
          intervention: 'ASPIRIN therapy',
          comparator: 'placebo',
          outcome: 'cancer prevention'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.plainLanguageSummary).toContain('💊 **Aspirin and Colorectal Cancer**');
    });

    it('should not trigger for aspirin without colorectal cancer', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-aspirin-3',
        title: 'Aspirin for cardiovascular disease prevention',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on aspirin for cardiovascular disease prevention',
        picos: {
          population: 'adults at risk for cardiovascular disease',
          intervention: 'low-dose aspirin',
          comparator: 'placebo',
          outcome: 'cardiovascular events'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.plainLanguageSummary).not.toContain('💊 **Aspirin and Colorectal Cancer**');
    });

    it('should not trigger for colorectal cancer without aspirin', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-aspirin-4',
        title: 'Chemotherapy for colorectal cancer treatment',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on chemotherapy for colorectal cancer treatment',
        picos: {
          population: 'patients with colorectal cancer',
          intervention: 'chemotherapy',
          comparator: 'standard care',
          outcome: 'survival outcomes'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.plainLanguageSummary).not.toContain('💊 **Aspirin and Colorectal Cancer**');
    });

    it('should trigger when aspirin is in intervention and colorectal in population', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-aspirin-5',
        title: 'Prevention strategies meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on prevention strategies',
        picos: {
          population: 'patients with colorectal adenomas',
          intervention: 'daily aspirin 81mg',
          comparator: 'no treatment',
          outcome: 'adenoma recurrence'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      expect(summary.plainLanguageSummary).toContain('💊 **Aspirin and Colorectal Cancer**');
    });
  });

  describe('Other Special Cases', () => {
    it('should handle studies without special case triggers normally', () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-normal-1',
        title: 'Standard treatment meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Study on standard treatment',
        picos: {
          population: 'patients with hypertension',
          intervention: 'ACE inhibitors',
          comparator: 'placebo',
          outcome: 'blood pressure reduction'
        }
      };

      const summary = metaSummaryService.generateSummary(mockMetaAnalysis);
      
      // Should generate normal summary without special case content
      expect(summary.plainLanguageSummary).toBeDefined();
      expect(summary.plainLanguageSummary).not.toContain('💊 **Aspirin and Colorectal Cancer**');
      expect(summary.structuredSummary.intervention).toBe('ACE inhibitors');
    });
  });
});
