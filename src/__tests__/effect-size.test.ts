import { EffectSizeRecovery } from '@/lib/research/effect-size-recovery';
import { EuropePMCClient, EuropePMCMetaAnalysis } from '@/lib/research/europepmc';

// Mock the EuropePMCClient
jest.mock('@/lib/research/europepmc');

describe('Effect Size Interpretation', () => {
  let effectSizeRecovery: EffectSizeRecovery;
  let mockEuropePMC: jest.Mocked<EuropePMCClient>;

  beforeEach(() => {
    mockEuropePMC = new EuropePMCClient() as jest.Mocked<EuropePMCClient>;
    effectSizeRecovery = new EffectSizeRecovery(mockEuropePMC);
  });

  describe('Effect Size Recovery', () => {
    it('should successfully recover effect size when relevant meta-analysis is found', async () => {
      const mockSearchResults: EuropePMCMetaAnalysis[] = [{
        id: 'test-1',
        title: 'Aspirin for cardiovascular disease prevention: A meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Meta-analysis of aspirin for cardiovascular disease prevention',
        outcomeMeasures: [{
          name: 'cardiovascular events',
          measure: 'Risk Ratio',
          value: 0.85,
          ciLower: 0.75,
          ciUpper: 0.95,
          pValue: 0.003,
          participants: 50000,
          studies: 15
        }]
      }];

      mockEuropePMC.searchMetaAnalyses.mockResolvedValue(mockSearchResults);

      const result = await effectSizeRecovery.recoverEffectSize(
        'aspirin',
        'cardiovascular events',
        'adults',
        'placebo'
      );

      expect(result.success).toBe(true);
      expect(result.effectSize).toBeDefined();
      expect(result.effectSize?.measure).toBe('Risk Ratio');
      expect(result.effectSize?.value).toBe(0.85);
      expect(result.effectSize?.ciLower).toBe(0.75);
      expect(result.effectSize?.ciUpper).toBe(0.95);
      expect(result.effectSize?.pValue).toBe(0.003);
    });

    it('should handle case when no relevant meta-analysis is found', async () => {
      mockEuropePMC.searchMetaAnalyses.mockResolvedValue([]);

      const result = await effectSizeRecovery.recoverEffectSize(
        'unknown-drug',
        'unknown-outcome',
        'unknown-population',
        'placebo'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('No direct effect size found');
      expect(result.message).toContain('unknown-drug unknown-outcome meta-analysis');
    });

    it('should handle case when meta-analysis found but no matching outcome', async () => {
      const mockSearchResults: EuropePMCMetaAnalysis[] = [{
        id: 'test-2',
        title: 'Drug X for condition Y: A meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Meta-analysis of drug X for condition Y',
        outcomeMeasures: [{
          name: 'different outcome',
          measure: 'Mean Difference',
          value: 2.5,
          ciLower: 1.0,
          ciUpper: 4.0,
          pValue: 0.01,
          participants: 1000,
          studies: 5
        }]
      }];

      mockEuropePMC.searchMetaAnalyses.mockResolvedValue(mockSearchResults);

      const result = await effectSizeRecovery.recoverEffectSize(
        'drug X',
        'target outcome',
        'patients',
        'placebo'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('No direct effect size found');
    });

    it('should handle API errors gracefully', async () => {
      mockEuropePMC.searchMetaAnalyses.mockRejectedValue(new Error('API Error'));

      const result = await effectSizeRecovery.recoverEffectSize(
        'aspirin',
        'cardiovascular events',
        'adults',
        'placebo'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error searching for effect size: API Error');
    });
  });

  describe('Meta-Analysis Enhancement', () => {
    it('should skip enhancement if outcome measures already exist', async () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-3',
        title: 'Existing meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Meta-analysis with existing outcome measures',
        outcomeMeasures: [{
          name: 'existing outcome',
          measure: 'Risk Ratio',
          value: 1.2,
          ciLower: 1.0,
          ciUpper: 1.4,
          pValue: 0.05,
          participants: 2000,
          studies: 8
        }]
      };

      const result = await effectSizeRecovery.enhanceMetaAnalysis(
        mockMetaAnalysis,
        'test intervention'
      );

      expect(result).toBe(mockMetaAnalysis);
      expect(mockEuropePMC.searchMetaAnalyses).not.toHaveBeenCalled();
    });

    it('should enhance meta-analysis with recovered effect sizes', async () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-4',
        title: 'Meta-analysis without outcome measures',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Meta-analysis without outcome measures',
        picos: {
          population: 'adults with hypertension',
          intervention: 'ACE inhibitors',
          comparator: 'placebo',
          outcome: 'blood pressure reduction, cardiovascular events'
        }
      };

      const mockSearchResults: EuropePMCMetaAnalysis[] = [{
        id: 'recovery-1',
        title: 'ACE inhibitors meta-analysis',
        authors: ['Recovery Author'],
        publishedDate: '2023-01-01',
        journal: 'Recovery Journal',
        doi: '10.1234/recovery',
        url: 'https://recovery.com',
        abstract: 'Recovery meta-analysis',
        outcomeMeasures: [{
          name: 'blood pressure reduction',
          measure: 'Mean Difference',
          value: -10.5,
          ciLower: -12.0,
          ciUpper: -9.0,
          pValue: 0.001,
          participants: 5000,
          studies: 20
        }]
      }];

      mockEuropePMC.searchMetaAnalyses.mockResolvedValue(mockSearchResults);

      const result = await effectSizeRecovery.enhanceMetaAnalysis(
        mockMetaAnalysis,
        'ACE inhibitors'
      );

      expect(result.outcomeMeasures).toBeDefined();
      expect(result.outcomeMeasures?.length).toBeGreaterThan(0);
      expect(result.outcomeMeasures?.[0].name).toBe('blood pressure reduction');
      expect(result.outcomeMeasures?.[0].value).toBe(-10.5);
    });

    it('should handle multiple outcomes in PICOS', async () => {
      const mockMetaAnalysis: EuropePMCMetaAnalysis = {
        id: 'test-5',
        title: 'Multi-outcome meta-analysis',
        authors: ['Test Author'],
        publishedDate: '2023-01-01',
        journal: 'Test Journal',
        doi: '10.1234/test',
        url: 'https://test.com',
        abstract: 'Meta-analysis with multiple outcomes',
        picos: {
          population: 'diabetic patients',
          intervention: 'metformin',
          comparator: 'placebo',
          outcome: 'HbA1c reduction; weight loss; cardiovascular events'
        }
      };

      // Mock multiple successful recoveries
      mockEuropePMC.searchMetaAnalyses
        .mockResolvedValueOnce([{
          id: 'recovery-hba1c',
          title: 'Metformin HbA1c meta-analysis',
          authors: ['Recovery Author'],
          publishedDate: '2023-01-01',
          journal: 'Recovery Journal',
          doi: '10.1234/recovery',
          url: 'https://recovery.com',
          abstract: 'Recovery meta-analysis',
          outcomeMeasures: [{
            name: 'HbA1c reduction',
            measure: 'Mean Difference',
            value: -0.8,
            ciLower: -1.0,
            ciUpper: -0.6,
            pValue: 0.001,
            participants: 3000,
            studies: 15
          }]
        }])
        .mockResolvedValueOnce([])  // No results for weight loss
        .mockResolvedValueOnce([{
          id: 'recovery-cv',
          title: 'Metformin cardiovascular meta-analysis',
          authors: ['Recovery Author'],
          publishedDate: '2023-01-01',
          journal: 'Recovery Journal',
          doi: '10.1234/recovery',
          url: 'https://recovery.com',
          abstract: 'Recovery meta-analysis',
          outcomeMeasures: [{
            name: 'cardiovascular events',
            measure: 'Risk Ratio',
            value: 0.85,
            ciLower: 0.75,
            ciUpper: 0.95,
            pValue: 0.005,
            participants: 8000,
            studies: 25
          }]
        }]);

      const result = await effectSizeRecovery.enhanceMetaAnalysis(
        mockMetaAnalysis,
        'metformin'
      );

      expect(result.outcomeMeasures).toBeDefined();
      expect(result.outcomeMeasures?.length).toBe(2);
      
      const hba1cOutcome = result.outcomeMeasures?.find(om => om.name === 'HbA1c reduction');
      expect(hba1cOutcome).toBeDefined();
      expect(hba1cOutcome?.value).toBe(-0.8);
      
      const cvOutcome = result.outcomeMeasures?.find(om => om.name === 'cardiovascular events');
      expect(cvOutcome).toBeDefined();
      expect(cvOutcome?.value).toBe(0.85);
    });
  });
});
