import { 
  calculateGRADEConfidence, 
  generateGRADESummary, 
  getDefaultGRADEAssessment,
  type GRADEAssessment,
  type GRADEDomain 
} from '@/lib/research/grade';

describe('GRADE Assessment Display', () => {
  describe('GRADE Confidence Calculation', () => {
    it('should calculate high confidence for RCT with no concerns', () => {
      const domains = {
        riskOfBias: { rating: 'no-concern' as const, reason: 'Low risk of bias' },
        inconsistency: { rating: 'no-concern' as const, reason: 'Consistent results' },
        indirectness: { rating: 'no-concern' as const, reason: 'Direct evidence' },
        imprecision: { rating: 'no-concern' as const, reason: 'Precise estimates' },
        publicationBias: { rating: 'no-concern' as const, reason: 'No publication bias' }
      };

      const confidence = calculateGRADEConfidence(domains);
      expect(confidence).toBe('high');
    });

    it('should calculate moderate confidence with one serious concern', () => {
      const domains = {
        riskOfBias: { rating: 'serious-concern' as const, reason: 'High risk of bias' },
        inconsistency: { rating: 'no-concern' as const, reason: 'Consistent results' },
        indirectness: { rating: 'no-concern' as const, reason: 'Direct evidence' },
        imprecision: { rating: 'no-concern' as const, reason: 'Precise estimates' },
        publicationBias: { rating: 'no-concern' as const, reason: 'No publication bias' }
      };

      const confidence = calculateGRADEConfidence(domains);
      expect(confidence).toBe('moderate');
    });

    it('should calculate low confidence with two serious concerns', () => {
      const domains = {
        riskOfBias: { rating: 'serious-concern' as const, reason: 'High risk of bias' },
        inconsistency: { rating: 'serious-concern' as const, reason: 'Inconsistent results' },
        indirectness: { rating: 'no-concern' as const, reason: 'Direct evidence' },
        imprecision: { rating: 'no-concern' as const, reason: 'Precise estimates' },
        publicationBias: { rating: 'no-concern' as const, reason: 'No publication bias' }
      };

      const confidence = calculateGRADEConfidence(domains);
      expect(confidence).toBe('low');
    });

    it('should calculate very low confidence with very serious concern', () => {
      const domains = {
        riskOfBias: { rating: 'very-serious-concern' as const, reason: 'Very high risk of bias' },
        inconsistency: { rating: 'no-concern' as const, reason: 'Consistent results' },
        indirectness: { rating: 'no-concern' as const, reason: 'Direct evidence' },
        imprecision: { rating: 'no-concern' as const, reason: 'Precise estimates' },
        publicationBias: { rating: 'no-concern' as const, reason: 'No publication bias' }
      };

      const confidence = calculateGRADEConfidence(domains);
      expect(confidence).toBe('very-low');
    });
  });

  describe('Default GRADE Assessment', () => {
    it('should provide high starting quality for RCTs', () => {
      const assessment = getDefaultGRADEAssessment('rct');
      
      expect(assessment.confidence).toBe('high');
      expect(assessment.domains.riskOfBias.rating).toBe('no-concern');
      expect(assessment.domains.inconsistency.rating).toBe('no-concern');
      expect(assessment.domains.indirectness.rating).toBe('no-concern');
      expect(assessment.domains.imprecision.rating).toBe('no-concern');
      expect(assessment.domains.publicationBias.rating).toBe('no-concern');
    });

    it('should provide low starting quality for observational studies', () => {
      const assessment = getDefaultGRADEAssessment('observational');
      
      expect(assessment.confidence).toBe('low');
      expect(assessment.domains.riskOfBias.rating).toBe('serious-concern');
      expect(assessment.reasons).toContain('Observational study design');
    });
  });

  describe('GRADE Summary Generation', () => {
    it('should generate comprehensive summary for high confidence', () => {
      const assessment: GRADEAssessment = {
        confidence: 'high',
        domains: {
          riskOfBias: { rating: 'no-concern', reason: 'Low risk of bias' },
          inconsistency: { rating: 'no-concern', reason: 'Consistent results' },
          indirectness: { rating: 'no-concern', reason: 'Direct evidence' },
          imprecision: { rating: 'no-concern', reason: 'Precise estimates' },
          publicationBias: { rating: 'no-concern', reason: 'No publication bias' }
        },
        reasons: []
      };

      const summary = generateGRADESummary(assessment);
      
      expect(summary).toContain('Overall confidence in the evidence: High');
      expect(summary).toContain('⊕⊕⊕⊕');
    });

    it('should include domain-specific concerns in summary', () => {
      const assessment: GRADEAssessment = {
        confidence: 'moderate',
        domains: {
          riskOfBias: { rating: 'serious-concern', reason: 'Selection bias detected' },
          inconsistency: { rating: 'no-concern', reason: 'Consistent results' },
          indirectness: { rating: 'no-concern', reason: 'Direct evidence' },
          imprecision: { rating: 'no-concern', reason: 'Precise estimates' },
          publicationBias: { rating: 'no-concern', reason: 'No publication bias' }
        },
        reasons: ['Risk of bias concerns']
      };

      const summary = generateGRADESummary(assessment);
      
      expect(summary).toContain('Overall confidence in the evidence: Moderate');
      expect(summary).toContain('Risk of bias: Selection bias detected');
      expect(summary).toContain('⊕⊕⊕⊝');
    });

    it('should handle very low confidence appropriately', () => {
      const assessment: GRADEAssessment = {
        confidence: 'very-low',
        domains: {
          riskOfBias: { rating: 'very-serious-concern', reason: 'Major methodological flaws' },
          inconsistency: { rating: 'serious-concern', reason: 'High heterogeneity' },
          indirectness: { rating: 'no-concern', reason: 'Direct evidence' },
          imprecision: { rating: 'serious-concern', reason: 'Wide confidence intervals' },
          publicationBias: { rating: 'no-concern', reason: 'No publication bias' }
        },
        reasons: ['Multiple serious concerns']
      };

      const summary = generateGRADESummary(assessment);
      
      expect(summary).toContain('Overall confidence in the evidence: Very Low');
      expect(summary).toContain('⊕⊝⊝⊝');
      expect(summary).toContain('Risk of bias: Major methodological flaws');
      expect(summary).toContain('Inconsistency: High heterogeneity');
      expect(summary).toContain('Imprecision: Wide confidence intervals');
    });
  });
});
