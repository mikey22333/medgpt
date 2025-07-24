export interface ScreeningLog {
  totalPapers: number;
  includedPapers: StudyDetails[];
  excludedPapers: ExclusionDetails[];
  searchStrategy: DatabaseQuery[];
  timeRange: DateRange;
  databaseDistribution: { [database: string]: number };
  qualityMetrics: QualityMetrics;
}

export interface StudyDetails {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  studyType: string;
  evidenceLevel: number;
  qualityScore: number;
  relevanceScore: number;
  database: string;
  doi?: string;
  pmid?: string;
}

export interface ExclusionDetails {
  id: string;
  title: string;
  authors: string[];
  journal?: string;
  publicationDate?: string;
  exclusionReason: ExclusionReason;
  database: string;
  doi?: string;
  pmid?: string;
  reasonDetails: string;
}

export type ExclusionReason = 
  | 'not_target_population'
  | 'outside_date_range'
  | 'insufficient_data'
  | 'duplicate'
  | 'wrong_study_type'
  | 'language_barrier'
  | 'poor_quality'
  | 'not_relevant'
  | 'predatory_journal'
  | 'retracted';

export interface DatabaseQuery {
  database: string;
  query: string;
  filters: any;
  resultsCount: number;
  timestamp: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface QualityMetrics {
  averageQualityScore: number;
  evidenceLevelDistribution: { [level: number]: number };
  studyTypeDistribution: { [type: string]: number };
  journalQualityDistribution: { [category: string]: number };
  openAccessPercentage: number;
}

export class ScreeningLogService {
  private screeningLogs: Map<string, ScreeningLog> = new Map();

  createScreeningLog(queryId: string): ScreeningLog {
    const log: ScreeningLog = {
      totalPapers: 0,
      includedPapers: [],
      excludedPapers: [],
      searchStrategy: [],
      timeRange: { start: '', end: '' },
      databaseDistribution: {},
      qualityMetrics: {
        averageQualityScore: 0,
        evidenceLevelDistribution: {},
        studyTypeDistribution: {},
        journalQualityDistribution: {},
        openAccessPercentage: 0
      }
    };

    this.screeningLogs.set(queryId, log);
    return log;
  }

  addSearchQuery(queryId: string, query: DatabaseQuery): void {
    const log = this.screeningLogs.get(queryId);
    if (!log) return;

    log.searchStrategy.push(query);
    log.databaseDistribution[query.database] = 
      (log.databaseDistribution[query.database] || 0) + query.resultsCount;
    log.totalPapers += query.resultsCount;
  }

  addIncludedPaper(queryId: string, paper: StudyDetails): void {
    const log = this.screeningLogs.get(queryId);
    if (!log) return;

    log.includedPapers.push(paper);
    this.updateQualityMetrics(log);
  }

  addExcludedPaper(queryId: string, paper: ExclusionDetails): void {
    const log = this.screeningLogs.get(queryId);
    if (!log) return;

    log.excludedPapers.push(paper);
  }

  setDateRange(queryId: string, dateRange: DateRange): void {
    const log = this.screeningLogs.get(queryId);
    if (!log) return;

    log.timeRange = dateRange;
  }

  getScreeningLog(queryId: string): ScreeningLog | undefined {
    return this.screeningLogs.get(queryId);
  }

  generateScreeningReport(queryId: string): string {
    const log = this.screeningLogs.get(queryId);
    if (!log) return 'No screening log found';

    return this.formatScreeningReport(log);
  }

  private updateQualityMetrics(log: ScreeningLog): void {
    const papers = log.includedPapers;
    if (papers.length === 0) return;

    // Average quality score
    log.qualityMetrics.averageQualityScore = 
      papers.reduce((sum, paper) => sum + paper.qualityScore, 0) / papers.length;

    // Evidence level distribution
    log.qualityMetrics.evidenceLevelDistribution = {};
    papers.forEach(paper => {
      const level = paper.evidenceLevel;
      log.qualityMetrics.evidenceLevelDistribution[level] = 
        (log.qualityMetrics.evidenceLevelDistribution[level] || 0) + 1;
    });

    // Study type distribution
    log.qualityMetrics.studyTypeDistribution = {};
    papers.forEach(paper => {
      const type = paper.studyType;
      log.qualityMetrics.studyTypeDistribution[type] = 
        (log.qualityMetrics.studyTypeDistribution[type] || 0) + 1;
    });

    // Journal quality distribution
    log.qualityMetrics.journalQualityDistribution = this.calculateJournalQualityDistribution(papers);

    // Open access percentage (simplified - would need actual open access data)
    log.qualityMetrics.openAccessPercentage = this.calculateOpenAccessPercentage(papers);
  }

  private calculateJournalQualityDistribution(papers: StudyDetails[]): { [category: string]: number } {
    const distribution = { 'High Impact': 0, 'Medium Impact': 0, 'Standard': 0, 'Open Access': 0 };
    
    papers.forEach(paper => {
      const journal = paper.journal.toLowerCase();
      
      if (this.isHighImpactJournal(journal)) {
        distribution['High Impact']++;
      } else if (this.isMediumImpactJournal(journal)) {
        distribution['Medium Impact']++;
      } else if (this.isOpenAccessJournal(journal)) {
        distribution['Open Access']++;
      } else {
        distribution['Standard']++;
      }
    });

    return distribution;
  }

  private isHighImpactJournal(journal: string): boolean {
    const highImpactJournals = [
      'new england journal of medicine', 'lancet', 'jama', 'nature', 'science',
      'nature medicine', 'cochrane database', 'bmj', 'annals of internal medicine'
    ];
    return highImpactJournals.some(high => journal.includes(high));
  }

  private isMediumImpactJournal(journal: string): boolean {
    const mediumImpactJournals = [
      'circulation', 'journal of the american college of cardiology',
      'diabetes care', 'american journal', 'european heart journal'
    ];
    return mediumImpactJournals.some(medium => journal.includes(medium));
  }

  private isOpenAccessJournal(journal: string): boolean {
    const openAccessJournals = ['plos', 'bmc', 'frontiers', 'nature communications'];
    return openAccessJournals.some(oa => journal.includes(oa));
  }

  private calculateOpenAccessPercentage(papers: StudyDetails[]): number {
    const openAccessCount = papers.filter(paper => 
      this.isOpenAccessJournal(paper.journal.toLowerCase()) || 
      paper.database === 'PMC' || 
      paper.database === 'DOAJ'
    ).length;
    
    return papers.length > 0 ? (openAccessCount / papers.length) * 100 : 0;
  }

  private formatScreeningReport(log: ScreeningLog): string {
    const report = `
📊 **Evidence Screening Log**

**Search Overview:**
- Total Papers Retrieved: ${log.totalPapers}
- Papers Included: ${log.includedPapers.length}
- Papers Excluded: ${log.excludedPapers.length}
- Inclusion Rate: ${log.totalPapers > 0 ? ((log.includedPapers.length / log.totalPapers) * 100).toFixed(1) : 0}%

**Database Distribution:**
${Object.entries(log.databaseDistribution)
  .map(([db, count]) => `- ${db}: ${count} papers`)
  .join('\n')}

**Search Strategy:**
${log.searchStrategy.map(query => 
  `- ${query.database}: "${query.query}" (${query.resultsCount} results)`
).join('\n')}

**Quality Metrics:**
- Average Quality Score: ${log.qualityMetrics.averageQualityScore.toFixed(1)}/100
- Open Access Coverage: ${log.qualityMetrics.openAccessPercentage.toFixed(1)}%

**Evidence Level Distribution:**
${Object.entries(log.qualityMetrics.evidenceLevelDistribution)
  .sort(([a], [b]) => parseInt(a) - parseInt(b))
  .map(([level, count]) => `- Level ${level}: ${count} studies`)
  .join('\n')}

**Study Type Distribution:**
${Object.entries(log.qualityMetrics.studyTypeDistribution)
  .sort(([,a], [,b]) => b - a)
  .map(([type, count]) => `- ${type}: ${count} studies`)
  .join('\n')}

**Excluded Studies:**
${log.excludedPapers.slice(0, 5).map(paper => 
  `- ${paper.title} (${paper.database}): ${this.formatExclusionReason(paper.exclusionReason)}`
).join('\n')}${log.excludedPapers.length > 5 ? `\n... and ${log.excludedPapers.length - 5} more` : ''}

**Date Range:** ${log.timeRange.start || 'No limit'} to ${log.timeRange.end || 'Present'}
`;

    return report.trim();
  }

  private formatExclusionReason(reason: ExclusionReason): string {
    const reasonMap: { [key in ExclusionReason]: string } = {
      'not_target_population': 'Population mismatch',
      'outside_date_range': 'Outside date range',
      'insufficient_data': 'Insufficient data',
      'duplicate': 'Duplicate study',
      'wrong_study_type': 'Wrong study type',
      'language_barrier': 'Non-English language',
      'poor_quality': 'Poor quality/bias',
      'not_relevant': 'Not relevant to query',
      'predatory_journal': 'Predatory journal',
      'retracted': 'Retracted publication'
    };

    return reasonMap[reason] || reason;
  }

  // Advanced screening analytics
  getScreeningStatistics(): {
    totalQueries: number;
    averageInclusionRate: number;
    commonExclusionReasons: { [reason: string]: number };
    databaseEffectiveness: { [database: string]: number };
  } {
    const allLogs = Array.from(this.screeningLogs.values());
    
    if (allLogs.length === 0) {
      return {
        totalQueries: 0,
        averageInclusionRate: 0,
        commonExclusionReasons: {},
        databaseEffectiveness: {}
      };
    }

    const totalQueries = allLogs.length;
    const inclusionRates = allLogs.map(log => 
      log.totalPapers > 0 ? (log.includedPapers.length / log.totalPapers) * 100 : 0
    );
    const averageInclusionRate = inclusionRates.reduce((sum, rate) => sum + rate, 0) / inclusionRates.length;

    // Common exclusion reasons
    const exclusionReasons: { [reason: string]: number } = {};
    allLogs.forEach(log => {
      log.excludedPapers.forEach(paper => {
        exclusionReasons[paper.exclusionReason] = (exclusionReasons[paper.exclusionReason] || 0) + 1;
      });
    });

    // Database effectiveness (inclusion rate per database)
    const databaseStats: { [database: string]: { included: number; total: number } } = {};
    allLogs.forEach(log => {
      log.includedPapers.forEach(paper => {
        if (!databaseStats[paper.database]) {
          databaseStats[paper.database] = { included: 0, total: 0 };
        }
        databaseStats[paper.database].included++;
      });
      
      Object.entries(log.databaseDistribution).forEach(([database, count]) => {
        if (!databaseStats[database]) {
          databaseStats[database] = { included: 0, total: 0 };
        }
        databaseStats[database].total += count;
      });
    });

    const databaseEffectiveness: { [database: string]: number } = {};
    Object.entries(databaseStats).forEach(([database, stats]) => {
      databaseEffectiveness[database] = stats.total > 0 ? (stats.included / stats.total) * 100 : 0;
    });

    return {
      totalQueries,
      averageInclusionRate,
      commonExclusionReasons: exclusionReasons,
      databaseEffectiveness
    };
  }

  // Clear old logs (for memory management)
  clearOldLogs(retentionDays = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const [queryId, log] of this.screeningLogs.entries()) {
      const logDate = log.searchStrategy[0]?.timestamp;
      if (logDate && new Date(logDate) < cutoffDate) {
        this.screeningLogs.delete(queryId);
      }
    }
  }
}
