import { MetaSummaryService, type MetaAnalysisSummary } from '../meta-summary';
import { getDefaultGRADEAssessment } from '../grade';
import '@testing-library/jest-dom';

// Enable test logging
console.log('Test file loaded');

describe('MetaSummaryService', () => {
  let service: MetaSummaryService;

  beforeEach(() => {
    service = new MetaSummaryService();
  });

  describe('generatePlainLanguageSummary', () => {
    it('should include core pathophysiology when available', () => {
      const summary: MetaAnalysisSummary = {
        title: 'Test Meta-analysis',
        authors: ['Author 1', 'Author 2'],
        year: 2023,
        journal: 'Test Journal',
        url: 'http://example.com',
        confidence: 'moderate',
        keyFindings: [],
        clinicalImplications: [],
        limitations: [],
        plainLanguageSummary: '',
        structuredSummary: {
          population: 'patients with lupus nephritis',
          intervention: 'mycophenolate mofetil',
          comparator: 'placebo',
          outcomes: [],
          certainty: 'moderate',
          importance: 'high'
        }
      };

      const result = service['generatePlainLanguageSummary'](summary);
      expect(result).toContain('🧬 **Core Pathophysiology**');
      expect(result).toContain('immune complex deposition');
    });

    it('should include GRADE table when assessment is provided', () => {
      const summary: MetaAnalysisSummary = {
        title: 'Test Meta-analysis',
        authors: ['Author 1', 'Author 2'],
        year: 2023,
        journal: 'Test Journal',
        url: 'http://example.com',
        confidence: 'moderate',
        keyFindings: [],
        clinicalImplications: [],
        limitations: [],
        plainLanguageSummary: '',
        structuredSummary: {
          population: 'patients with diabetes',
          intervention: 'metformin',
          comparator: 'placebo',
          outcomes: [],
          certainty: 'moderate',
          importance: 'high'
        },
        gradeAssessment: getDefaultGRADEAssessment('rct')
      };

      const result = service['generatePlainLanguageSummary'](summary);
      expect(result).toContain('📊 **GRADE Summary**');
      expect(result).toContain('Risk of Bias');
      expect(result).toContain('⬤⬤⬤⬤⬤');
    });

    it('should include aspirin-specific paragraph for colorectal cancer', () => {
      const summary: MetaAnalysisSummary = {
        title: 'Test Meta-analysis',
        authors: ['Author 1', 'Author 2'],
        year: 2023,
        journal: 'Test Journal',
        url: 'http://example.com',
        confidence: 'moderate',
        keyFindings: [],
        clinicalImplications: [],
        limitations: [],
        plainLanguageSummary: '',
        structuredSummary: {
          population: 'adults at risk for colorectal cancer',
          intervention: 'low-dose aspirin',
          comparator: 'placebo',
          outcomes: [],
          certainty: 'moderate',
          importance: 'high'
        }
      };

      const result = service['generatePlainLanguageSummary'](summary);
      expect(result).toContain('💊 **Aspirin and Colorectal Cancer**');
      expect(result).toContain('reduce the long-term risk');
    });
  });
});
