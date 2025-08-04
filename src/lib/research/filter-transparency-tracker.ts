/**
 * Filter Transparency Tracker for CliniSynth
 * Monitors and logs filter pipeline performance to identify bottlenecks
 */

export interface FilterStageReport {
  stage: string;
  inputCount: number;
  outputCount: number;
  reductionRate: number;
  excludedPapers: Array<{
    title: string;
    source: string;
    exclusionReason: string;
  }>;
  commonExclusionReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  timestamp: Date;
}

export interface FilterPipelineReport {
  totalStages: number;
  overallReduction: number;
  initialCount: number;
  finalCount: number;
  bottleneckStages: Array<{
    stage: string;
    reductionRate: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendedAdjustments: Array<{
    stage: string;
    issue: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  stages: FilterStageReport[];
}

export class FilterTransparencyTracker {
  private filterStages: FilterStageReport[] = [];
  private startTime: Date = new Date();

  trackFilterStage(
    stageName: string,
    inputPapers: any[],
    outputPapers: any[],
    exclusionReasons: Array<{ paper: any; reason: string }> = []
  ): void {
    const inputCount = inputPapers.length;
    const outputCount = outputPapers.length;
    const reductionRate = inputCount > 0 ? (inputCount - outputCount) / inputCount : 0;

    // Extract excluded papers with reasons
    const excludedPapers = exclusionReasons.slice(0, 10).map(item => ({
      title: (item.paper.title || 'Unknown Title').substring(0, 80),
      source: item.paper.source || 'Unknown Source',
      exclusionReason: item.reason
    }));

    // Aggregate exclusion reasons
    const reasonCounts = new Map<string, number>();
    exclusionReasons.forEach(item => {
      const count = reasonCounts.get(item.reason) || 0;
      reasonCounts.set(item.reason, count + 1);
    });

    const commonExclusionReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: exclusionReasons.length > 0 ? (count / exclusionReasons.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stageReport: FilterStageReport = {
      stage: stageName,
      inputCount,
      outputCount,
      reductionRate,
      excludedPapers,
      commonExclusionReasons,
      timestamp: new Date()
    };

    this.filterStages.push(stageReport);

    // Real-time logging for debugging
    console.log(`🔍 FILTER TRANSPARENCY: ${stageName}`);
    console.log(`   📊 Input: ${inputCount} → Output: ${outputCount} (${(reductionRate * 100).toFixed(1)}% reduction)`);
    
    if (reductionRate > 0.5) {
      console.log(`   ⚠️  HIGH REDUCTION RATE: ${(reductionRate * 100).toFixed(1)}% may be too aggressive`);
    }
    
    if (commonExclusionReasons.length > 0) {
      console.log(`   📋 Top exclusion reasons:`);
      commonExclusionReasons.slice(0, 3).forEach(reason => {
        console.log(`      • ${reason.reason}: ${reason.count} papers (${reason.percentage.toFixed(1)}%)`);
      });
    }
  }

  generateFilterReport(): FilterPipelineReport {
    if (this.filterStages.length === 0) {
      return {
        totalStages: 0,
        overallReduction: 0,
        initialCount: 0,
        finalCount: 0,
        bottleneckStages: [],
        recommendedAdjustments: [],
        stages: []
      };
    }

    const initialCount = this.filterStages[0].inputCount;
    const finalCount = this.filterStages[this.filterStages.length - 1].outputCount;
    const overallReduction = initialCount > 0 ? (initialCount - finalCount) / initialCount : 0;

    // Identify bottleneck stages (high reduction rates)
    const bottleneckStages = this.filterStages
      .map(stage => ({
        stage: stage.stage,
        reductionRate: stage.reductionRate,
        impact: this.categorizeImpact(stage.reductionRate)
      }))
      .filter(stage => stage.impact !== 'low')
      .sort((a, b) => b.reductionRate - a.reductionRate);

    // Generate recommendations
    const recommendedAdjustments = this.generateRecommendations();

    return {
      totalStages: this.filterStages.length,
      overallReduction,
      initialCount,
      finalCount,
      bottleneckStages,
      recommendedAdjustments,
      stages: this.filterStages
    };
  }

  private categorizeImpact(reductionRate: number): 'low' | 'medium' | 'high' | 'critical' {
    if (reductionRate >= 0.8) return 'critical';
    if (reductionRate >= 0.6) return 'high';
    if (reductionRate >= 0.3) return 'medium';
    return 'low';
  }

  private generateRecommendations(): Array<{
    stage: string;
    issue: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const recommendations: Array<{
      stage: string;
      issue: string;
      suggestion: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    this.filterStages.forEach(stage => {
      // Critical reduction rate
      if (stage.reductionRate >= 0.8) {
        recommendations.push({
          stage: stage.stage,
          issue: `Critical reduction rate: ${(stage.reductionRate * 100).toFixed(1)}%`,
          suggestion: 'Consider relaxing filter criteria or implementing progressive filtering',
          priority: 'high'
        });
      }

      // High exclusion for specific reasons
      stage.commonExclusionReasons.forEach(reason => {
        if (reason.percentage > 50) {
          recommendations.push({
            stage: stage.stage,
            issue: `High exclusion for: ${reason.reason} (${reason.percentage.toFixed(1)}%)`,
            suggestion: 'Review if this exclusion criterion is too strict',
            priority: 'medium'
          });
        }
      });

      // Low output count
      if (stage.outputCount < 5) {
        recommendations.push({
          stage: stage.stage,
          issue: `Very low output count: ${stage.outputCount} papers`,
          suggestion: 'Consider fallback strategies or relaxed criteria',
          priority: 'high'
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  logFinalSummary(): void {
    const report = this.generateFilterReport();
    
    console.log('\n🎯 FILTER PIPELINE SUMMARY:');
    console.log(`   📊 Overall: ${report.initialCount} → ${report.finalCount} papers (${(report.overallReduction * 100).toFixed(1)}% reduction)`);
    console.log(`   🔧 Stages: ${report.totalStages} filter stages executed`);
    
    if (report.bottleneckStages.length > 0) {
      console.log('   ⚠️  Bottleneck stages:');
      report.bottleneckStages.slice(0, 3).forEach(bottleneck => {
        console.log(`      • ${bottleneck.stage}: ${(bottleneck.reductionRate * 100).toFixed(1)}% reduction (${bottleneck.impact} impact)`);
      });
    }
    
    if (report.recommendedAdjustments.length > 0) {
      console.log('   💡 Recommendations:');
      report.recommendedAdjustments.slice(0, 3).forEach(rec => {
        console.log(`      • ${rec.stage}: ${rec.suggestion}`);
      });
    }

    // Alert if overall reduction is too high
    if (report.overallReduction > 0.9) {
      console.log('   🚨 ALERT: Very high overall reduction rate may indicate over-filtering');
    }
  }

  reset(): void {
    this.filterStages = [];
    this.startTime = new Date();
  }
}

export default FilterTransparencyTracker;
