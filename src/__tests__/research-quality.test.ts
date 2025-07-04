import { 
  getEvidenceLevelWeight, 
  calculateImpactScore, 
  getEvidenceIcon, 
  getQualityRating,
  extractKeyFindings,
  createIntelligentSummary
} from '@/app/api/research/route';

// Test the evidence level improvements
describe('Research Quality Improvements', () => {
  describe('Evidence Level Prioritization', () => {
    it('should strongly prioritize Level 1A evidence', () => {
      const level1A = getEvidenceLevelWeight('Level 1A (Highest)');
      const level5 = getEvidenceLevelWeight('Level 5 (Expert Opinion)');
      
      expect(level1A).toBe(100);
      expect(level5).toBe(10);
      expect(level1A / level5).toBe(10); // 10x priority difference
    });

    it('should assign appropriate evidence icons', () => {
      expect(getEvidenceIcon('Level 1A (Highest)')).toBe('🏆');
      expect(getEvidenceIcon('Level 2 (High)')).toBe('🔬');
      expect(getEvidenceIcon('Level 5 (Expert Opinion)')).toBe('📝');
    });

    it('should provide clear quality ratings', () => {
      expect(getQualityRating('Level 1A (Highest)')).toBe('🟢 Excellent');
      expect(getQualityRating('Level 3A (Moderate)')).toBe('🟡 Moderate');
      expect(getQualityRating('Level 5 (Expert Opinion)')).toBe('🔴 Limited');
    });
  });

  describe('Impact Score Calculation', () => {
    it('should calculate comprehensive impact scores', () => {
      const highQualityPaper = {
        evidenceLevel: 'Level 1A (Highest)',
        relevanceScore: 0.9,
        journal: 'New England Journal of Medicine',
        citationCount: 150
      };

      const lowQualityPaper = {
        evidenceLevel: 'Level 5 (Expert Opinion)',
        relevanceScore: 0.4,
        journal: 'Unknown Journal',
        citationCount: 5
      };

      const highScore = calculateImpactScore(highQualityPaper);
      const lowScore = calculateImpactScore(lowQualityPaper);

      expect(highScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(8); // Should be high impact
      expect(lowScore).toBeLessThan(6); // Should be lower impact
    });
  });

  describe('AI-Paraphrased Summaries', () => {
    it('should extract key findings from abstracts', () => {
      const abstract = `Background: This study examined treatment effects. 
      Methods: We conducted a randomized trial. 
      Results: The treatment showed significant improvement in outcomes. 
      The intervention reduced symptoms by 40%. 
      Conclusions: This provides evidence for clinical use.`;

      const findings = extractKeyFindings(abstract);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings.some(f => f.includes('showed significant improvement'))).toBe(true);
      expect(findings.some(f => f.includes('reduced symptoms by 40%'))).toBe(true);
    });

    it('should create intelligent summaries without truncation', () => {
      const abstract = `This study demonstrates the effectiveness of the new treatment approach in managing diabetes. The randomized controlled trial showed significant improvement in glycemic control. However, the research is ongoing and more studies are needed to...`;

      const summary = createIntelligentSummary(abstract);

      expect(summary).not.toContain('...');
      expect(summary).toContain('treatment approach');
      expect(summary).toMatch(/\.$|clinical decision-making\.|treatment approaches\.$/); // Should end properly
    });
  });

  describe('Biomedical Filtering', () => {
    it('should identify biomedical papers correctly', () => {
      const medicalPaper = {
        title: 'Randomized Controlled Trial of Diabetes Treatment',
        abstract: 'This clinical study examined patient outcomes with new therapy'
      };

      const nonMedicalPaper = {
        title: 'Algorithm Optimization for Database Systems',
        abstract: 'This computer science research focuses on software performance'
      };

      expect(isBiomedicalPaper(medicalPaper.title, medicalPaper.abstract, 'diabetes')).toBe(true);
      expect(isBiomedicalPaper(nonMedicalPaper.title, nonMedicalPaper.abstract, 'diabetes')).toBe(false);
    });
  });
});

// Integration test for the full research flow
describe('Research API Integration', () => {
  it('should prefer high-quality evidence in search results', async () => {
    const mockPapers = [
      {
        title: 'Meta-analysis of Diabetes Treatments',
        abstract: 'Systematic review and meta-analysis of randomized controlled trials',
        evidenceLevel: 'Level 1A (Highest)',
        relevanceScore: 0.85
      },
      {
        title: 'Expert Opinion on Diabetes',
        abstract: 'Clinical experience and expert recommendations',
        evidenceLevel: 'Level 5 (Expert Opinion)',
        relevanceScore: 0.90
      }
    ];

    // Sort using the same logic as the API
    const sorted = mockPapers.sort((a, b) => {
      const aLevel = getEvidenceLevelWeight(a.evidenceLevel);
      const bLevel = getEvidenceLevelWeight(b.evidenceLevel);
      
      if (Math.abs(aLevel - bLevel) >= 1) {
        return bLevel - aLevel;
      }
      return b.relevanceScore - a.relevanceScore;
    });

    // Meta-analysis should come first despite lower relevance score
    expect(sorted[0].title).toBe('Meta-analysis of Diabetes Treatments');
    expect(sorted[1].title).toBe('Expert Opinion on Diabetes');
  });
});
