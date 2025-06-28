import { EuropePMCMetaAnalysis } from "./europepmc";
import { GRADEConfidence, type GRADEAssessment } from "./grade";

/**
 * Service for generating structured summaries of meta-analyses
 */
export class MetaSummaryService {
  /**
   * Generate a comprehensive summary of a meta-analysis
   */
  generateSummary(metaAnalysis: EuropePMCMetaAnalysis): MetaAnalysisSummary {
    // Start with basic study information
    const summary: MetaAnalysisSummary = {
      title: metaAnalysis.title,
      authors: metaAnalysis.authors,
      year: new Date(metaAnalysis.publishedDate).getFullYear() || new Date().getFullYear(),
      journal: metaAnalysis.journal,
      doi: metaAnalysis.doi,
      url: metaAnalysis.url,
      confidence: metaAnalysis.gradeAssessment?.confidence || 'moderate',
      gradeAssessment: metaAnalysis.gradeAssessment, // Add gradeAssessment here
      keyFindings: [],
      clinicalImplications: [],
      limitations: [],
      plainLanguageSummary: '',
      structuredSummary: {
        population: '',
        intervention: '',
        comparator: '',
        outcomes: [],
        certainty: 'moderate',
        importance: 'moderate'
      }
    };

    // Extract PICOS elements if available
    if (metaAnalysis.picos) {
      summary.structuredSummary = {
        ...summary.structuredSummary,
        population: metaAnalysis.picos.population || 'Not specified',
        intervention: metaAnalysis.picos.intervention || 'Not specified',
        comparator: metaAnalysis.picos.comparator || 'Not specified',
        outcomes: metaAnalysis.outcomeMeasures?.map(om => ({
          name: om.name,
          measure: om.measure,
          value: om.value,
          ci: om.ciLower && om.ciUpper ? [om.ciLower, om.ciUpper] : undefined,
          pValue: om.pValue,
          participants: om.participants,
          studies: om.studies
        })) || []
      };
    }

    // Generate key findings from outcome measures
    if (metaAnalysis.outcomeMeasures?.length) {
      summary.keyFindings = metaAnalysis.outcomeMeasures.map(outcome => {
        const effect = this.formatEffect(outcome);
        const certainty = this.determineCertainty(metaAnalysis, outcome);
        
        return {
          outcome: outcome.name,
          effect,
          certainty,
          participants: outcome.participants,
          studies: outcome.studies,
          interpretation: this.interpretEffect(outcome)
        };
      });
    }

    // Generate clinical implications
    if (summary.keyFindings.length > 0) {
      summary.clinicalImplications = this.generateClinicalImplications(summary.keyFindings);
    }

    // Extract limitations from GRADE assessment
    if (metaAnalysis.gradeAssessment) {
      const { domains } = metaAnalysis.gradeAssessment;
      
      if (domains.riskOfBias.rating === 'serious' || domains.riskOfBias.rating === 'very-serious') {
        summary.limitations.push(domains.riskOfBias.reason);
      }
      
      if (domains.inconsistency.rating === 'serious' || domains.inconsistency.rating === 'very-serious') {
        summary.limitations.push(domains.inconsistency.reason);
      }
      
      if (domains.imprecision.rating === 'serious' || domains.imprecision.rating === 'very-serious') {
        summary.limitations.push(domains.imprecision.reason);
      }
      
      if (domains.publicationBias.rating === 'suspected') {
        summary.limitations.push('Potential publication bias detected');
      }
    }

    // Generate plain language summary
    summary.plainLanguageSummary = this.generatePlainLanguageSummary(summary);

    return summary;
  }

  /**
   * Format an effect size with confidence intervals
   */
  private formatEffect(outcome: {
    measure: string;
    value: number;
    ciLower?: number;
    ciUpper?: number;
    pValue?: number;
  }): string {
    const measure = outcome.measure.toUpperCase();
    const value = outcome.value.toFixed(2);
    
    if (outcome.ciLower !== undefined && outcome.ciUpper !== undefined) {
      const ci = `(${outcome.ciLower.toFixed(2)}-${outcome.ciUpper.toFixed(2)})`;
      return `${measure} = ${value} ${ci}`;
    }
    
    return `${measure} = ${value}`;
  }

  /**
   * Determine certainty of evidence for an outcome
   */
  private determineCertainty(
    metaAnalysis: EuropePMCMetaAnalysis,
    outcome: { i2?: number; participants?: number; studies?: number }
  ): 'high' | 'moderate' | 'low' | 'very-low' {
    // Start with the overall GRADE confidence if available
    let certainty: GRADEConfidence = metaAnalysis.gradeAssessment?.confidence || 'moderate';
    
    // Adjust based on outcome-specific factors
    if (outcome.i2 !== undefined) {
      if (outcome.i2 > 75) {
        certainty = this.downgradeCertainty(certainty, 2); // Major inconsistency
      } else if (outcome.i2 > 50) {
        certainty = this.downgradeCertainty(certainty, 1); // Some inconsistency
      }
    }
    
    if (outcome.participants && outcome.participants < 300) {
      certainty = this.downgradeCertainty(certainty, 1); // Small sample size
    }
    
    if (outcome.studies && outcome.studies < 5) {
      certainty = this.downgradeCertainty(certainty, 1); // Few studies
    }
    
    return certainty;
  }

  /**
   * Downgrade certainty level
   */
  private downgradeCertainty(
    current: GRADEConfidence,
    levels: number = 1
  ): GRADEConfidence {
    const levelsMap: GRADEConfidence[] = ['high', 'moderate', 'low', 'very-low'];
    const currentIndex = levelsMap.indexOf(current);
    return levelsMap[Math.min(currentIndex + levels, levelsMap.length - 1)];
  }

  /**
   * Interpret the clinical significance of an effect
   */
  private interpretEffect(outcome: {
    measure: string;
    value: number;
    ciLower?: number;
    ciUpper?: number;
  }): string {
    const measure = outcome.measure.toLowerCase();
    const value = outcome.value;
    
    // For relative measures (RR, OR, HR)
    if (['rr', 'or', 'hr'].includes(measure)) {
      if (value > 1) {
        const percent = Math.round((value - 1) * 100);
        return `Associated with ${percent}% increased risk`;
      } else if (value < 1) {
        const percent = Math.round((1 - value) * 100);
        return `Associated with ${percent}% reduced risk`;
      }
      return 'No significant association';
    }
    
    // For standardized mean differences
    if (measure === 'smd' || measure === 'md') {
      const absValue = Math.abs(value);
      if (absValue < 0.2) return 'Trivial effect';
      if (absValue < 0.5) return 'Small effect';
      if (absValue < 0.8) return 'Moderate effect';
      return 'Large effect';
    }
    
    return 'Effect interpretation not available';
  }

  /**
   * Generate clinical implications from key findings
   */
  private generateClinicalImplications(
    findings: Array<{
      outcome: string;
      effect: string;
      certainty: string;
      interpretation: string;
    }>
  ): string[] {
    return findings.map(finding => {
      const certaintyPhrase = {
        'high': 'High certainty evidence',
        'moderate': 'Moderate certainty evidence',
        'low': 'Low certainty evidence',
        'very-low': 'Very low certainty evidence'
      }[finding.certainty] || 'Evidence';
      
      return `${certaintyPhrase} suggests that ${finding.interpretation}`;
    });
  }

  /**
   * Highlight effect size measures in text (RR, OR, NNT, etc.)
   */
  private highlightEffectSizes(text: string): string {
    // Match common effect size measures with optional formatting
    return text.replace(
      /\b(RR|OR|HR|NNT|SMD|MD|RD)\s*[=:<>≈]?\s*[0-9.]+(?:\s*[\-–]\s*[0-9.]+)?(?:\s*\([^)]+\))?/gi, 
      match => `**${match}**`
    );
  }

  /**
   * Get core pathophysiology for a condition if available in our knowledge base
   */
  private getCorePathophysiology(condition: string): string | null {
    // This would normally come from a medical knowledge base
    const pathoKnowledgeBase: Record<string, string> = {
      'lupus nephritis': 
        'Lupus nephritis is driven by immune complex deposition in the glomeruli due to autoantibodies (primarily anti-dsDNA). ' +
        'This leads to complement activation, inflammatory cell recruitment, and damage to the glomerular basement membrane. ' +
        'Chronic inflammation results in proteinuria, hematuria, and possible renal failure.',
      'diabetes':
        'Diabetes mellitus is characterized by chronic hyperglycemia resulting from defects in insulin secretion, ' +
        'insulin action, or both. Chronic hyperglycemia leads to microvascular and macrovascular complications ' +
        'through mechanisms including advanced glycation end products, oxidative stress, and inflammation.'
    };

    const normalizedCondition = condition.toLowerCase();
    for (const [key, value] of Object.entries(pathoKnowledgeBase)) {
      if (normalizedCondition.includes(key)) {
        return value;
      }
    }
    return null;
  }

  /**
   * Generate a GRADE visual cue table
   */
  private generateGRADETable(assessment: any): string {
    if (!assessment || !assessment.domains) return '';
    
    const { domains } = assessment;
    const getRatingDots = (rating: string) => {
      const ratingMap: Record<string, string> = {
        'no': '⬤⬤⬤⬤⬤',
        'no-concern': '⬤⬤⬤⬤⬤',
        'suspected': '⬤⬤⬤⚪⚪',
        'undetected': '⬤⬤⬤⬤⚪',
        'serious': '⬤⬤⚪⚪⚪',
        'very-serious': '⬤⚪⚪⚪⚪'
      };
      return ratingMap[rating] || '⚪⚪⚪⚪⚪';
    };

    const rows = [
      { factor: 'Risk of Bias', rating: domains.riskOfBias.rating, notes: domains.riskOfBias.reason },
      { factor: 'Indirectness', rating: domains.indirectness.rating, notes: domains.indirectness.reason },
      { factor: 'Inconsistency', rating: domains.inconsistency.rating, notes: domains.inconsistency.reason },
      { factor: 'Publication Bias', rating: domains.publicationBias.rating, notes: domains.publicationBias.reason },
      { 
        factor: 'Overall Confidence', 
        rating: assessment.confidence === 'high' ? 'no' : 
               assessment.confidence === 'moderate' ? 'undetected' :
               assessment.confidence === 'low' ? 'serious' : 'very-serious',
        notes: `Based on GRADE assessment`
      }
    ];

    const tableLines = [
      '| Factor | Rating | Notes |',
      '|--------|--------|-------|',
      ...rows.map(row => `| ${row.factor} | ${getRatingDots(row.rating)} | ${row.notes} |`)
    ];

    return tableLines.join('\n');
  }

  /**
   * Generate a plain language summary with highlighted effect sizes
   */
  private generatePlainLanguageSummary(summary: MetaAnalysisSummary): string {
    const { keyFindings, clinicalImplications, limitations, structuredSummary } = summary;
    const lines: string[] = [];
    const { intervention, population, outcomes } = structuredSummary;
    
    // Add header with intervention-specific summary
    lines.push(`This meta-analysis examined the effect of ${intervention} ` +
              `in ${population}.`);
    
    // Add core pathophysiology if available
    const corePatho = this.getCorePathophysiology(population);
    if (corePatho) {
      lines.push('\n🧬 **Core Pathophysiology**  ');
      lines.push(corePatho);
    }
    
    // Add GRADE assessment table if available
    if (summary.gradeAssessment) {
      lines.push('\n📊 **GRADE Summary**  \n' + this.generateGRADETable(summary.gradeAssessment));
    }
    
    // Add the specific paragraph about aspirin and colorectal cancer if relevant
    if (intervention.toLowerCase().includes('aspirin') && 
        population.toLowerCase().includes('colorectal')) {
      lines.push('\n💊 **Aspirin and Colorectal Cancer**  \n' +
                'Regular low-dose **aspirin** may reduce the long-term risk of **colorectal cancer** in adults. ' +
                'However, the exact benefit varies by individual risk, and further research is needed to confirm these findings.');
    }
    
    // Add key findings with highlighted effect sizes
    if (keyFindings.length > 0) {
      lines.push('\n**Key findings:**');
      keyFindings.forEach(finding => {
        const highlighted = this.highlightEffectSizes(finding.interpretation);
        lines.push(`- ${highlighted} (${finding.effect}, ${finding.certainty} certainty)`);
      });
    }
    
    // Add clinical implications with highlighted effect sizes
    if (clinicalImplications.length > 0) {
      lines.push('\n**Clinical implications:**');
      clinicalImplications.forEach(implication => {
        const highlighted = this.highlightEffectSizes(implication);
        lines.push(`- ${highlighted}`);
      });
    }
    
    // Add limitations
    if (limitations.length > 0) {
      lines.push('\n**Limitations:**');
      limitations.forEach(limitation => {
        lines.push(`- ${limitation}`);
      });
    }
    
    // Add confidence statement
    const confidenceText = summary.confidence === 'high' ? 'high confidence' : 
                         summary.confidence === 'moderate' ? 'moderate confidence' :
                         summary.confidence === 'low' ? 'low confidence' : 'very low confidence';
    
    lines.push(`\n**Overall confidence in these findings:** ${confidenceText} (based on GRADE assessment).`);
    
    return lines.join('\n');
  }
}

/**
 * Structured summary of a meta-analysis
 */
export interface MetaAnalysisSummary {
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi?: string;
  gradeAssessment?: GRADEAssessment;
  url: string;
  confidence: GRADEConfidence;
  keyFindings: Array<{
    outcome: string;
    effect: string;
    certainty: 'high' | 'moderate' | 'low' | 'very-low';
    participants?: number;
    studies?: number;
    interpretation: string;
  }>;
  clinicalImplications: string[];
  limitations: string[];
  plainLanguageSummary: string;
  structuredSummary: {
    population: string;
    intervention: string;
    comparator: string;
    outcomes: Array<{
      name: string;
      measure: string;
      value: number;
      ci?: [number, number];
      pValue?: number;
      participants?: number;
      studies?: number;
    }>;
    certainty: 'high' | 'moderate' | 'low' | 'very-low';
    importance: 'high' | 'moderate' | 'low';
  };
}
