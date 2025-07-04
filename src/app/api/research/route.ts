import { NextRequest, NextResponse } from "next/server";
import { PubMedClient } from "@/lib/research/pubmed";
import { SemanticScholarClient } from "@/lib/research/semantic-scholar";
import { crossRefAPI, medicalResearchHelpers } from "@/lib/research/crossref";
import { EuropePMCClient } from "@/lib/research/europepmc";
import { FDAClient } from "@/lib/research/fda";
import { OpenAlexClient } from "@/lib/research/openalex";
// New high-quality medical databases
import { DOAJClient } from "@/lib/research/doaj";
import { BioRxivClient } from "@/lib/research/biorxiv";
import { ClinicalTrialsClient } from "@/lib/research/clinicaltrials";
import { GuidelineCentralClient } from "@/lib/research/guideline-central";
import { NIHReporterClient } from "@/lib/research/nih-reporter";
import { type ResearchQuery, type PubMedArticle, type SemanticScholarPaper, type CrossRefPaper } from "@/lib/types/research";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle chat-style requests with actual research
    if (body.sessionId && body.mode) {
      const { query, sessionId, mode } = body;
      
      if (!query || query.trim().length === 0) {
        return NextResponse.json(
          { error: "Query is required" },
          { status: 400 }
        );
      }

      // Perform actual research search for chat requests with ALL 10 APIs
      console.log("🔍 Research mode chat request:", query);
      
      const maxResults = 10; // Increased to show more relevant citations
      let pubmedPapers: PubMedArticle[] = [];
      let crossRefPapers: CrossRefPaper[] = [];
      let semanticScholarPapers: SemanticScholarPaper[] = [];
      let europePMCPapers: any[] = [];
      let fdaPapers: any[] = [];
      let openAlexPapers: any[] = [];
      // New high-quality medical databases
      let doajArticles: any[] = [];
      let biorxivPreprints: any[] = [];
      let clinicalTrials: any[] = [];
      let guidelines: any[] = [];
      let nihProjects: any[] = [];
      let totalPapersScanned = 0; // Track total papers analyzed

      // API 1: Search PubMed (Primary medical literature) - Enhanced for high-quality studies
      try {
        const pubmedClient = new PubMedClient(process.env.PUBMED_API_KEY);
        
        // Enhanced search strategy for high-quality evidence
        const enhancedQuery = buildHighQualitySearchQuery(query);
        
        pubmedPapers = await pubmedClient.searchArticles({
          query: enhancedQuery,
          maxResults: 10, // Increased to capture more high-quality studies
          source: "pubmed",
        });
        totalPapersScanned += pubmedPapers.length;
        console.log("📚 PubMed papers found:", pubmedPapers.length);
      } catch (error) {
        console.error("PubMed search error:", error);
      }

      // Smart fallback: If PubMed has few results, prioritize other APIs
      const pubmedResultCount = pubmedPapers.length;
      const needsMoreSources = pubmedResultCount < 2;
      
      if (needsMoreSources) {
        console.log("🔄 PubMed has limited results, activating enhanced fallback APIs...");
      }

      // API 2: Search Semantic Scholar (AI-powered research) - Enhanced when needed
      try {
        const semanticScholarClient = new SemanticScholarClient(process.env.SEMANTIC_SCHOLAR_API_KEY);
        semanticScholarPapers = await semanticScholarClient.searchPapers({
          query: query,
          maxResults: needsMoreSources ? 8 : 5, // More results if PubMed is limited
          source: "semantic-scholar",
        });
        totalPapersScanned += semanticScholarPapers.length;
        console.log("🤖 Semantic Scholar papers found:", semanticScholarPapers.length);
      } catch (error) {
        console.error("Semantic Scholar search error:", error);
      }

      // API 3: Search Europe PMC (European biomedical literature) - Enhanced when needed
      try {
        const europePMCClient = new EuropePMCClient();
        europePMCPapers = await europePMCClient.searchArticles({
          query: query,
          maxResults: needsMoreSources ? 8 : 5, // More results if PubMed is limited
          source: "europepmc",
        });
        totalPapersScanned += europePMCPapers.length;
        console.log("🇪🇺 Europe PMC papers found:", europePMCPapers.length);
      } catch (error) {
        console.error("Europe PMC search error:", error);
      }

      // API 4: Search FDA databases (Drug safety and regulatory) - Enhanced for drug queries
      if (query.toLowerCase().includes('drug') || query.toLowerCase().includes('medication') || 
          query.toLowerCase().includes('treatment') || query.toLowerCase().includes('therapy')) {
        try {
          const fdaClient = new FDAClient();
          fdaPapers = await fdaClient.searchAll(query);
          // More FDA results if PubMed is limited
          fdaPapers = fdaPapers.slice(0, needsMoreSources ? 4 : 2);
          totalPapersScanned += fdaPapers.length;
          console.log("💊 FDA papers found:", fdaPapers.length);
        } catch (error) {
          console.error("FDA search error:", error);
        }
      }

      // API 5: Search OpenAlex (Open access academic papers) - Enhanced when needed
      try {
        const openAlexClient = new OpenAlexClient();
        openAlexPapers = await openAlexClient.searchPapers({
          query: query,
          maxResults: 5, // Increased for more relevant results
          source: "openalex",
        });
        totalPapersScanned += openAlexPapers.length;
        console.log("🌐 OpenAlex papers found:", openAlexPapers.length);
      } catch (error) {
        console.error("OpenAlex search error:", error);
      }

      // API 6: Search CrossRef (Scholarly research linking)
      try {
        const crossRefResults = await crossRefAPI.searchMedicalResearch(query, {
          limit: 5 // Increased for more relevant results
        });
        
        totalPapersScanned += crossRefResults.length;
        
        crossRefPapers = crossRefResults.map(work => ({
          id: work.DOI || `crossref-${Date.now()}-${Math.random()}`,
          doi: work.DOI,
          title: cleanupText(work.title?.[0] || 'Untitled'),
          abstract: cleanupText(work.abstract || ''),
          authors: work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || ['Unknown Author'],
          journal: work['container-title']?.[0] || 'Unknown Journal',
          year: work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
          url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
          citationCount: work['is-referenced-by-count'] || 0,
          isOpenAccess: work.license ? work.license.length > 0 : false,
          type: work.type,
          publisher: work.publisher,
          volume: work.volume,
          issue: work.issue,
          pages: work.page
        }));
        console.log("📄 Found CrossRef papers:", crossRefPapers.length);
      } catch (error) {
        console.error("CrossRef search error:", error);
      }

      // API 7: Search DOAJ (Directory of Open Access Journals) - Free high-quality journals
      try {
        const doajClient = new DOAJClient();
        doajArticles = await doajClient.searchMedicalArticles(query, 5); // Increased for medical open access
        totalPapersScanned += doajArticles.length;
        console.log("📂 DOAJ open access articles found:", doajArticles.length);
      } catch (error) {
        console.error("DOAJ search error:", error);
      }

      // API 8: Search bioRxiv/medRxiv (Free preprint servers)
      try {
        const biorxivClient = new BioRxivClient();
        biorxivPreprints = await biorxivClient.searchMedicalPreprints(query, 3); // Increased for medical preprints
        totalPapersScanned += biorxivPreprints.length;
        console.log("🧬 bioRxiv/medRxiv preprints found:", biorxivPreprints.length);
      } catch (error) {
        console.error("bioRxiv search error:", error);
      }

      // API 9: Search ClinicalTrials.gov (Active and completed trials)
      try {
        const trialsClient = new ClinicalTrialsClient();
        clinicalTrials = await trialsClient.searchTrials(query, 3); // Increased for most relevant trials
        totalPapersScanned += clinicalTrials.length;
        console.log("⚗️ Clinical trials found:", clinicalTrials.length);
      } catch (error) {
        console.error("ClinicalTrials.gov search error:", error);
      }

      // API 10: Search Clinical Guidelines (NICE, AHA, USPSTF, etc.)
      try {
        const guidelineClient = new GuidelineCentralClient(process.env.GUIDELINE_API_KEY);
        guidelines = await guidelineClient.searchGuidelines(query, 3); // Increased for major guidelines
        totalPapersScanned += guidelines.length;
        console.log("📋 Clinical guidelines found:", guidelines.length);
      } catch (error) {
        console.error("Clinical guidelines search error:", error);
      }

      // API 11: Search NIH RePORTER (Funded research projects and outcomes)
      try {
        const nihClient = new NIHReporterClient();
        nihProjects = await nihClient.searchMedicalResearch(query, 5); // Increased for most relevant funded research
        totalPapersScanned += nihProjects.length;
        console.log("🏛️ NIH funded projects found:", nihProjects.length);
      } catch (error) {
        console.error("NIH RePORTER search error:", error);
      }

      // Check total results after all API calls and provide fallback if needed
      const totalResults = pubmedPapers.length + crossRefPapers.length + semanticScholarPapers.length + 
                          europePMCPapers.length + fdaPapers.length + openAlexPapers.length + 
                          doajArticles.length + biorxivPreprints.length + clinicalTrials.length + 
                          guidelines.length + nihProjects.length;
      
      console.log(`📊 Total papers collected from all sources: ${totalResults}`);
      
      // If we have very few results, suggest alternative search strategies
      if (totalResults < 3) {
        console.log("⚠️ Limited results found - may need to broaden search or check alternative databases");
      }
      const combinedResults = [
        // PubMed papers
        ...pubmedPapers.map(paper => ({
          id: paper.pmid,
          title: cleanupText(paper.title),
          authors: paper.authors,
          journal: paper.journal,
          year: new Date(paper.publishedDate).getFullYear(),
          doi: paper.doi,
          url: paper.url,
          abstract: cleanupText(paper.abstract),
          source: "PubMed",
          pmid: paper.pmid,
          relevanceScore: calculateRelevanceScore(paper.title, paper.abstract, query),
          studyType: inferStudyType(paper.title, paper.abstract),
          evidenceLevel: inferEvidenceLevel(paper.title, paper.abstract)
        })),
        // CrossRef papers
        ...crossRefPapers.map(paper => ({
          id: paper.id,
          title: cleanupText(paper.title),
          authors: paper.authors,
          journal: paper.journal,
          year: paper.year,
          doi: paper.doi,
          url: paper.url,
          abstract: cleanupText(paper.abstract || ''),
          source: "CrossRef",
          relevanceScore: calculateRelevanceScore(paper.title, paper.abstract || '', query),
          studyType: inferStudyType(paper.title, paper.abstract || ''),
          evidenceLevel: inferEvidenceLevel(paper.title, paper.abstract || '')
        })),
        // Semantic Scholar papers
        ...semanticScholarPapers.map(paper => ({
          id: paper.paperId || `semantic-${Date.now()}-${Math.random()}`,
          title: cleanupText(paper.title),
          authors: paper.authors?.map(a => a.name) || ['Unknown Author'],
          journal: paper.venue || 'Unknown Journal',
          year: paper.year || new Date().getFullYear(),
          doi: paper.doi,
          url: paper.url,
          abstract: cleanupText(paper.abstract || ''),
          source: "Semantic Scholar",
          citationCount: paper.citationCount || 0,
          relevanceScore: calculateRelevanceScore(paper.title, paper.abstract || '', query),
          studyType: inferStudyType(paper.title, paper.abstract || ''),
          evidenceLevel: inferEvidenceLevel(paper.title, paper.abstract || '')
        })),
        // Europe PMC papers
        ...europePMCPapers.map(paper => ({
          id: paper.pmid || paper.pmcid || `europepmc-${Date.now()}-${Math.random()}`,
          title: cleanupText(paper.title),
          authors: paper.authorString?.split(', ') || ['Unknown Author'],
          journal: paper.journalTitle || 'Unknown Journal',
          year: parseInt(paper.pubYear) || new Date().getFullYear(),
          doi: paper.doi,
          url: paper.fullTextUrlList?.[0]?.url || (paper.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/` : undefined),
          abstract: cleanupText(paper.abstractText || ''),
          source: "Europe PMC",
          pmid: paper.pmid,
          pmcid: paper.pmcid,
          relevanceScore: calculateRelevanceScore(paper.title, paper.abstractText || '', query),
          studyType: inferStudyType(paper.title, paper.abstractText || ''),
          evidenceLevel: inferEvidenceLevel(paper.title, paper.abstractText || '')
        })),
        // FDA papers
        ...fdaPapers.map(paper => ({
          id: paper.application_number || paper.product_number || `fda-${Date.now()}-${Math.random()}`,
          title: cleanupText(paper.brand_name || paper.generic_name || paper.description || 'FDA Document'),
          authors: ['FDA'],
          journal: 'FDA Database',
          year: parseInt(paper.submission_date?.substring(0, 4)) || new Date().getFullYear(),
          doi: undefined,
          url: paper.url,
          abstract: cleanupText(paper.description || paper.indication || paper.reason_for_recall || 'FDA regulatory information'),
          source: "FDA",
          relevanceScore: calculateRelevanceScore(paper.brand_name || paper.generic_name || '', paper.description || '', query),
          studyType: 'Regulatory Document',
          evidenceLevel: 'Level 4 (Regulatory)'
        })),
        // OpenAlex papers
        ...openAlexPapers.map(paper => ({
          id: paper.id || `openalex-${Date.now()}-${Math.random()}`,
          title: cleanupText(paper.title),
          authors: paper.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) || ['Unknown Author'],
          journal: paper.primary_location?.source?.display_name || 'Unknown Journal',
          year: paper.publication_year || new Date().getFullYear(),
          doi: paper.doi?.replace('https://doi.org/', ''),
          url: paper.doi || paper.primary_location?.landing_page_url,
          abstract: cleanupText(paper.abstract_inverted_index ? 
            Object.entries(paper.abstract_inverted_index)
              .sort(([,a], [,b]) => Math.min(...(a as number[])) - Math.min(...(b as number[])))
              .map(([word]) => word)
              .join(' ') : ''),
          source: "OpenAlex",
          citationCount: paper.cited_by_count || 0,
          relevanceScore: calculateRelevanceScore(paper.title, '', query),
          studyType: inferStudyType(paper.title, ''),
          evidenceLevel: inferEvidenceLevel(paper.title, '')
        })),
        // DOAJ Open Access Articles
        ...doajArticles.map(article => ({
          id: article.id || `doaj-${Date.now()}-${Math.random()}`,
          title: cleanupText(article.title),
          authors: article.authors || ['Unknown Author'],
          journal: article.journal || 'DOAJ Open Access Journal',
          year: new Date(article.publishedDate).getFullYear(),
          doi: article.doi,
          url: article.url || article.fullTextUrl,
          abstract: cleanupText(article.abstract || ''),
          source: "DOAJ",
          relevanceScore: calculateRelevanceScore(article.title, article.abstract || '', query),
          studyType: 'Open Access Research Article',
          evidenceLevel: 'Level 3A (Peer-Reviewed)',
          evidenceClass: 'Open Access Research',
          openAccess: true,
          fullTextAvailable: !!article.fullTextUrl,
          subjects: article.subject,
          language: article.language
        })),
        // bioRxiv/medRxiv Preprints (Latest research, not peer-reviewed)
        ...biorxivPreprints.map(preprint => ({
          id: preprint.id || `biorxiv-${Date.now()}-${Math.random()}`,
          title: cleanupText(preprint.title),
          authors: preprint.authors || ['Unknown Author'],
          journal: `${preprint.server} Preprint`,
          year: new Date(preprint.publishedDate).getFullYear(),
          doi: preprint.doi,
          url: preprint.url,
          abstract: cleanupText(preprint.abstract || ''),
          source: preprint.server,
          relevanceScore: calculateRelevanceScore(preprint.title, preprint.abstract || '', query),
          studyType: 'Preprint (Not Peer-Reviewed)',
          evidenceLevel: 'Level 4 (Preprint)',
          evidenceClass: 'Preprint Research',
          isPeerReviewed: false,
          version: preprint.version,
          category: preprint.category,
          fullTextUrl: preprint.fullTextUrl
        })),
        // Clinical Trials (NIH ClinicalTrials.gov data)
        ...clinicalTrials.map(trial => ({
          id: trial.nctId || `trial-${Date.now()}-${Math.random()}`,
          title: cleanupText(trial.title),
          authors: trial.sponsors || ['Clinical Trial Sponsor'],
          journal: 'ClinicalTrials.gov',
          year: trial.startDate ? new Date(trial.startDate).getFullYear() : new Date().getFullYear(),
          doi: undefined,
          url: trial.url || `https://clinicaltrials.gov/ct2/show/${trial.nctId}`,
          abstract: cleanupText(trial.briefSummary + (trial.detailedDescription ? ` ${trial.detailedDescription}` : '')),
          source: "ClinicalTrials.gov",
          relevanceScore: calculateRelevanceScore(trial.title, trial.briefSummary || '', query),
          studyType: `Clinical Trial (${trial.phase})`,
          evidenceLevel: trial.phase.includes('Phase 3') || trial.phase.includes('Phase 4') ? 'Level 2 (High)' : 
                        trial.phase.includes('Phase 2') ? 'Level 3A (Moderate)' : 'Level 4 (Early Phase)',
          evidenceClass: 'Clinical Trial Data',
          nctId: trial.nctId,
          phase: trial.phase,
          status: trial.status,
          conditions: trial.conditions,
          interventions: trial.interventions,
          enrollment: trial.enrollment,
          resultsAvailable: trial.resultsAvailable,
          studyResults: trial.studyResults
        })),
        // Clinical Guidelines (NICE, AHA, USPSTF, etc.)
        ...guidelines.map(guideline => ({
          id: guideline.id || `guideline-${Date.now()}-${Math.random()}`,
          title: cleanupText(guideline.title),
          authors: [guideline.organization],
          journal: `${guideline.organization} Guidelines`,
          year: new Date(guideline.publishedDate).getFullYear(),
          doi: undefined,
          url: guideline.url,
          abstract: cleanupText(guideline.summary + (guideline.fullText ? ` ${guideline.fullText.substring(0, 500)}...` : '')),
          source: "Clinical Guidelines",
          relevanceScore: calculateRelevanceScore(guideline.title, guideline.summary || '', query),
          studyType: 'Clinical Practice Guideline',
          evidenceLevel: guideline.qualityRating === 'A' ? 'Level 1B (Very High)' :
                        guideline.qualityRating === 'B' ? 'Level 2 (High)' :
                        guideline.qualityRating === 'C' ? 'Level 3A (Moderate)' : 'Level 4 (Low-Moderate)',
          evidenceClass: 'Practice Guideline',
          organization: guideline.organization,
          specialty: guideline.specialty,
          conditions: guideline.conditions,
          recommendations: guideline.recommendations,
          qualityRating: guideline.qualityRating,
          implementationLevel: guideline.implementationLevel,
          evidenceBase: guideline.evidenceBase
        })),
        // NIH Funded Research Projects (NIH RePORTER data)
        ...nihProjects.map(project => ({
          id: project.project_num || `nih-${Date.now()}-${Math.random()}`,
          title: cleanupText(project.project_title),
          authors: project.principal_investigators?.map((pi: any) => `${pi.first_name} ${pi.last_name}`) || ['NIH Investigator'],
          journal: `NIH ${project.agency_ic_admin?.abbreviation || 'NIH'} Funded Research`,
          year: project.fiscal_year || new Date().getFullYear(),
          doi: undefined,
          url: `https://reporter.nih.gov/project-details/${project.project_num}`,
          abstract: cleanupText(project.project_detail?.abstract_text || project.project_detail?.public_health_relevance || ''),
          source: "NIH RePORTER",
          relevanceScore: calculateRelevanceScore(project.project_title, project.project_detail?.abstract_text || '', query),
          studyType: project.clinical_trial ? 'NIH Clinical Research' : 'NIH Basic/Translational Research',
          evidenceLevel: project.publications?.length > 0 ? 'Level 3A (Research with Publications)' : 'Level 4 (Research in Progress)',
          evidenceClass: 'Funded Research Project',
          projectNumber: project.project_num,
          organization: project.organization_name,
          fundingAgency: project.agency_ic_admin?.name,
          awardAmount: project.award_amount,
          fiscalYear: project.fiscal_year,
          publications: project.publications?.length || 0,
          clinicalTrial: project.clinical_trial ? {
            id: project.clinical_trial.clinical_trial_id,
            type: project.clinical_trial.study_type,
            phase: project.clinical_trial.phase,
            status: project.clinical_trial.status
          } : undefined,
          startDate: project.project_start_date,
          endDate: project.project_end_date
        }))
      ];
      
      // Enrich metadata for papers with missing information
      for (const paper of combinedResults) {
        if ((paper.authors.includes('Unknown Author') || paper.journal === 'Unknown Journal') && paper.doi) {
          try {
            const enrichedMetadata = await fetchMetadataFromDOI(paper.doi);
            if (enrichedMetadata) {
              if (paper.authors.includes('Unknown Author') && enrichedMetadata.authors.length > 0) {
                paper.authors = enrichedMetadata.authors;
              }
              if (paper.journal === 'Unknown Journal' && enrichedMetadata.journal) {
                paper.journal = enrichedMetadata.journal;
              }
              if (!paper.abstract && enrichedMetadata.abstract) {
                paper.abstract = enrichedMetadata.abstract;
              }
            }
          } catch (error) {
            console.warn(`Failed to enrich metadata for DOI ${paper.doi}:`, error);
          }
        }
      }
      
      // Deduplicate papers based on DOI or title similarity
      const deduplicatedResults = combinedResults.reduce((unique: any[], paper) => {
        const isDuplicate = unique.some(existing => {
          // Check for exact DOI match
          if (paper.doi && existing.doi && paper.doi === existing.doi) {
            return true;
          }
          
          // Check for exact PMID match (only for papers that have pmid property)
          if ((paper as any).pmid && (existing as any).pmid && (paper as any).pmid === (existing as any).pmid) {
            return true;
          }
          
          // Check for title similarity (very high threshold to avoid false positives)
          const titleSimilarity = calculateStringsimilarities(paper.title.toLowerCase(), existing.title.toLowerCase());
          if (titleSimilarity > 0.95) {
            return true;
          }
          
          return false;
        });
        
        if (!isDuplicate) {
          unique.push(paper);
        } else {
          // If duplicate found, keep the one from the preferred source
          const sourcePreference = [
            'Cochrane Library',        // Highest priority - gold standard meta-analyses
            'PubMed',                 // High priority - primary medical literature
            'Clinical Guidelines',     // High priority - evidence-based practice guidelines
            'Trip Database',          // High priority - filtered evidence-based studies
            'ClinicalTrials.gov',     // Medium-high priority - trial data
            'CrossRef',               // Medium priority - scholarly linking
            'Europe PMC',             // Medium priority - European biomedical literature
            'Semantic Scholar',       // Medium priority - AI-powered research
            'OpenAlex',               // Lower priority - general academic papers
            'FDA'                     // Lowest priority - regulatory documents
          ];
          const existingIndex = unique.findIndex(existing => {
            return (paper.doi && existing.doi && paper.doi === existing.doi) ||
                   ((paper as any).pmid && (existing as any).pmid && (paper as any).pmid === (existing as any).pmid) ||
                   (calculateStringsimilarities(paper.title.toLowerCase(), existing.title.toLowerCase()) > 0.95);
          });
          
          if (existingIndex !== -1) {
            const currentSourceRank = sourcePreference.indexOf(paper.source);
            const existingSourceRank = sourcePreference.indexOf(unique[existingIndex].source);
            
            // Replace if current source is preferred (lower rank = higher preference)
            if (currentSourceRank !== -1 && (existingSourceRank === -1 || currentSourceRank < existingSourceRank)) {
              unique[existingIndex] = paper;
            }
          }
        }
        
        return unique;
      }, [])
      // Apply filtering - balanced approach for quality and inclusivity
      const medicallyRelevantPapers = deduplicatedResults.filter(paper => {
        // BALANCED filtering: Good quality and relevance
        const isBiomedical = checkBiomedicalRelevance(paper.title, paper.abstract || '');
        const hasGoodRelevance = paper.relevanceScore > 0.15; // Further reduced threshold for more inclusivity
        
        // Additional check for computational/non-medical terms in title
        const nonMedicalInTitle = [
          'density functional', 'computational chemistry', 'quantum', 'polymer',
          'catalyst', 'synthesis', 'molecular dynamics', 'materials science',
          'engineering', 'physics', 'computer science', 'semiempirical'
        ].some(term => paper.title.toLowerCase().includes(term));
        
        return isBiomedical && hasGoodRelevance && !nonMedicalInTitle;
      });
      
      const finalFilteredPapers = medicallyRelevantPapers.filter(paper => {
        // BALANCED evidence quality filtering - good quality evidence
        const evidenceWeight = getEvidenceLevelWeight(paper.evidenceLevel);
        const relevanceThreshold = 0.15; // Further reduced threshold for more inclusivity
        const evidenceThreshold = 10; // Further reduced threshold to include more databases
        
        return paper.relevanceScore >= relevanceThreshold && 
               evidenceWeight >= evidenceThreshold &&
               isBiomedicalPaper(paper.title, paper.abstract || '', query);
      });
      
      console.log(`📊 Final paper count: ${finalFilteredPapers.length} (from ${deduplicatedResults.length} deduplicated papers)`);
      
      // Use enhanced evidence hierarchy prioritization instead of basic sorting
      const finalResults = prioritizeByEvidenceHierarchy(finalFilteredPapers).slice(0, maxResults);

      // Generate enhanced conversational response
      let response = `# Research Analysis: ${query}\n\n`;
      
      // Add scanning statistics
      response += `> 📊 **Research Scope:** ${totalPapersScanned} papers analyzed → ${finalResults.length} high-quality sources selected\n\n`;
      
      if (finalResults.length > 0) {
        // Fix #4: Split confidence metrics for clarity
        const searchCoverageScore = calculateSearchCoverage(totalPapersScanned, query);
        const evidenceConfidenceScore = calculateEvidenceConfidence(finalResults);
        
        response += `**📡 Search Coverage: ${searchCoverageScore}%** (database comprehensiveness) | **📊 Evidence Confidence: ${evidenceConfidenceScore}%** (quality of retrieved papers)\n\n`;
        
        response += "## 📚 Key Research Findings\n\n";
        
        finalResults.forEach((paper, index) => {
          const clinicalInsight = generateClinicalInsight(paper, query);
          const plainLanguageSummary = generatePlainLanguageSummary(paper.abstract || '', query);
          const evidenceIcon = getEvidenceIcon(paper.evidenceLevel);
          const impactScore = calculateImpactScore(paper);
          const gradeOutcomes = calculateGRADEScore(paper);
          
          response += `### ${index + 1}. ${paper.title}\n\n`;
          
          // Enhanced metadata card with visual indicators
          response += `> ${evidenceIcon} **Evidence Level:** ${paper.evidenceLevel} | **Study Type:** ${paper.studyType}  \n`;
          response += `> 📊 **Impact Score:** ${impactScore}/10 (based on evidence level, relevance, and journal ranking) | **Relevance:** ${Math.round(paper.relevanceScore * 100)}%  \n`;
          response += `> 👥 **Authors:** ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}  \n`;
          response += `> 📰 **Source:** ${paper.journal} (${paper.year}) | **Database:** ${paper.source}`;
          
          // Add direct citation links
          if (paper.doi) {
            response += ` | 🔗 [DOI](https://doi.org/${paper.doi})`;
          }
          if ((paper as any).pmid) {
            response += ` | 📋 [PMID:${(paper as any).pmid}](https://pubmed.ncbi.nlm.nih.gov/${(paper as any).pmid}/)`;
          }
          response += `\n\n`;
          
          response += `**🔍 Key Findings:** ${plainLanguageSummary}\n\n`;
          response += `**💡 Clinical Implications:** ${clinicalInsight}\n\n`;
          
          // Add GRADE assessment
          response += formatGRADEResults(gradeOutcomes);
          
          if (paper.url) {
            response += `[📖 Access Full Paper](${paper.url})\n\n`;
          }
        });

        // Evidence assessment with detailed analysis and visual indicators
        const metaAnalyses = finalResults.filter(p => p.studyType.includes('Meta-analysis')).length;
        const systematicReviews = finalResults.filter(p => p.studyType.includes('Systematic Review')).length;
        const rcts = finalResults.filter(p => p.studyType.includes('RCT')).length;
        const clinicalTrials = finalResults.filter(p => p.studyType.includes('Clinical Trial')).length;
        const guidelines = finalResults.filter(p => p.studyType.includes('Clinical Practice Guideline')).length;
        const level1Evidence = finalResults.filter(p => p.evidenceLevel.includes('Level 1')).length;
        const level2Evidence = finalResults.filter(p => p.evidenceLevel.includes('Level 2')).length;
        const level3Evidence = finalResults.filter(p => p.evidenceLevel.includes('Level 3')).length;
        
        // Age analysis
        const currentYear = new Date().getFullYear();
        const recentPapers = finalResults.filter(p => (currentYear - p.year) <= 5).length;
        const oldPapers = finalResults.filter(p => (currentYear - p.year) > 5).length;
        
        response += "---\n\n## 📊 GRADE Evidence Quality Summary\n\n";
        
        // Create comprehensive GRADE summary table
        response += createGRADESummaryTable(finalResults, query);
        
        response += "\n## 📈 Evidence Quality Assessment\n\n";
        
        // Create detailed evidence table with visual quality indicators
        response += `| Paper | Relevance | Evidence Level | Impact Score | Quality Rating | GRADE Score |\n`;
        response += `|-------|-----------|----------------|--------------|----------------|-------------|\n`;
        
        finalResults.forEach((paper, index) => {
          const evidenceIcon = getEvidenceIcon(paper.evidenceLevel);
          const impactScore = calculateImpactScore(paper);
          const qualityRating = getQualityRating(paper.evidenceLevel);
          const relevancePercent = Math.round(paper.relevanceScore * 100);
          const gradeOutcomes = calculateGRADEScore(paper);
          const primaryGrade = gradeOutcomes.length > 0 ? gradeOutcomes[0].score : '⭐⚪⚪⚪';
          
          response += `| Paper ${index + 1} | ✅ ${relevancePercent}% | ${evidenceIcon} ${paper.evidenceLevel} | ${impactScore}/10 | ${qualityRating} | ${primaryGrade} |\n`;
        });
        
        // Add API source summary
        const apiSourceCounts = finalResults.reduce((counts: any, paper) => {
          counts[paper.source] = (counts[paper.source] || 0) + 1;
          return counts;
        }, {});
        
        response += `\n**📡 Data Sources Used:**\n`;
        Object.entries(apiSourceCounts).forEach(([source, count]) => {
          const sourceIcon = getSourceIcon(source);
          response += `- ${sourceIcon} **${source}**: ${count} paper${count !== 1 ? 's' : ''}\n`;
        });
        
        response += `\n**Research Summary:**\n`;
        response += `- 📚 Total papers analyzed: **${totalPapersScanned}**\n`;
        response += `- ✅ Papers selected: **${finalResults.length}** (filtered from ${totalPapersScanned} analyzed)\n`;
        
        // Enhanced evidence quality reporting
        if (level1Evidence + level2Evidence > 0) {
          response += `- 🏆 High-quality evidence: **${level1Evidence + level2Evidence}** Level 1-2 papers\n`;
          if (metaAnalyses > 0) response += `  - 🥇 Meta-analyses: **${metaAnalyses}**\n`;
          if (systematicReviews > 0) response += `  - 📊 Systematic reviews: **${systematicReviews}**\n`;
          if (rcts > 0) response += `  - 🔬 RCTs: **${rcts}**\n`;
          if (guidelines > 0) response += `  - 📋 Clinical guidelines: **${guidelines}**\n`;
        } else {
          response += `- ⚠️ Limited high-quality evidence available - consider systematic search strategies\n`;
        }
        
        // Age analysis
        if (oldPapers > 0) {
          response += `- ⚠️ Evidence age concern: **${oldPapers}** papers over 5 years old\n`;
        }
        if (recentPapers >= finalResults.length * 0.7) {
          response += `- ✅ Current evidence: **${recentPapers}** recent papers (≤5 years)\n`;
        }
        
        response += `- 📊 Level 3+ Evidence: **${level3Evidence}** papers\n\n`;
        
        const overallQuality = assessOverallQuality(combinedResults);
        const confidenceColor = getConfidenceColor(overallQuality);
        response += `**Overall Confidence:** ${confidenceColor} ${overallQuality}\n\n`;
        
        response += "## 🎯 Clinical Recommendations\n\n";
        response += generateClinicalRecommendations(combinedResults, query);
        
        // Add fallback knowledge for missing key treatments
        if (query.toLowerCase().includes('migraine') && !combinedResults.some(p => 
          p.title.toLowerCase().includes('cgrp') || 
          p.title.toLowerCase().includes('gepant') || 
          p.abstract?.toLowerCase().includes('erenumab') ||
          p.abstract?.toLowerCase().includes('ubrogepant')
        )) {
          response += "\n## 💡 Additional Clinical Context\n\n";
          response += "**Note:** Current evidence-based migraine treatments also include:\n";
          response += "- **CGRP Monoclonal Antibodies** (erenumab, fremanezumab, galcanezumab) for prevention with superior tolerability\n";
          response += "- **CGRP Receptor Antagonists (Gepants)** (ubrogepant, rimegepant) for acute treatment without cardiovascular contraindications\n";
          response += "- **Ditans** (lasmiditan) for acute treatment in patients with cardiovascular disease\n";
          response += "- **Neuromodulation devices** for non-pharmacological prevention and acute treatment\n\n";
          response += "*Consider searching specifically for these newer agents and their clinical trial data.*\n\n";
        }
        
        response += "---\n\n## ⚠️ Research Limitations\n\n";
        response += "- Individual patient factors may influence treatment applicability\n";
        response += "- Review methodology sections for study limitations and bias assessment\n";
        response += "- Consider publication bias and funding sources\n";
        response += "- Integrate findings with current clinical practice guidelines\n\n";

        response += "---\n\n## 📄 Export Options\n\n";
        response += "**💡 Pro Tip:** Use the PDF export button below to save this research analysis for offline review or sharing with colleagues.\n\n";

        response += "**Medical Disclaimer:** This research synthesis is for educational purposes only. Clinical decisions must involve qualified healthcare providers considering individual patient factors.";
      } else {
        response = generateNoResultsResponse(query);
      }        return NextResponse.json({
        response,
        citations: finalResults
          .filter(paper => {
            // Balanced filtering for citations - consistent with main filtering thresholds
            const evidenceWeight = getEvidenceLevelWeight(paper.evidenceLevel);
            const isRelevant = paper.relevanceScore >= 0.15; // Updated to match main filtering threshold
            const isGoodEvidence = evidenceWeight >= 10; // Updated to match main filtering threshold
            
            // Extra filter: exclude Global Burden of Disease studies from citations for treatment queries
            if (query.toLowerCase().includes('treatment') || query.toLowerCase().includes('therapy') || 
                query.toLowerCase().includes('prevention') || query.toLowerCase().includes('latest')) {
              const isEpidemiological = paper.title.toLowerCase().includes('global burden of disease') ||
                                      paper.title.toLowerCase().includes('gbd study') ||
                                      paper.title.toLowerCase().includes('systematic analysis for the global burden');
              if (isEpidemiological) {
                return false; // Exclude epidemiological studies from treatment query citations
              }
            }
            
            return isRelevant && isGoodEvidence;
          })
          .slice(0, 15) // Increased to show more citations from various databases
          .map(paper => ({
            title: paper.title,
            authors: paper.authors,
            journal: paper.journal,
            year: paper.year,
            url: paper.url,
            doi: paper.doi,
            pmid: 'pmid' in paper ? paper.pmid : undefined,
            source: paper.source
          })),
        reasoningSteps: [
          {
            step: 1,
            title: "Database Search",
            process: `Searched 11 medical databases (PubMed, CrossRef, Semantic Scholar, FDA, Europe PMC, OpenAlex, DOAJ, bioRxiv/medRxiv, ClinicalTrials.gov, Clinical Guidelines, NIH RePORTER) for: "${query}"`
          },
          {
            step: 2,
            title: "Result Analysis",
            process: `Found ${combinedResults.length} relevant papers, filtered for quality and relevance`
          },
          {
            step: 3,
            title: "Evidence Synthesis",
            process: "Generated comprehensive summary with citations and quality assessment"
          }
        ],
        sessionId,
        mode
      });
    }

    // Handle direct research API requests (original functionality)
    const researchQuery: ResearchQuery = body;
    
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const maxResults = Math.min(body.maxResults || 5, 10); // Limit to prevent abuse
    const source = body.source || "all";

    let pubmedPapers: PubMedArticle[] = [];
    let semanticScholarPapers: SemanticScholarPaper[] = [];
    let crossRefPapers: CrossRefPaper[] = [];

    // Search PubMed
    if (source === "pubmed" || source === "all") {
      try {
        const pubmedClient = new PubMedClient(process.env.PUBMED_API_KEY);
        pubmedPapers = await pubmedClient.searchArticles({
          query: researchQuery.query,
          maxResults: Math.ceil(maxResults / (source === "all" ? 3 : 1)),
          source: "pubmed",
        });
      } catch (error) {
        console.error("PubMed search error:", error);
        // Continue with other sources if PubMed fails
      }
    }

    // Search Semantic Scholar
    if (source === "semantic-scholar" || source === "all") {
      try {
        const semanticScholarClient = new SemanticScholarClient(process.env.SEMANTIC_SCHOLAR_API_KEY);
        semanticScholarPapers = await semanticScholarClient.searchPapers({
          query: researchQuery.query,
          maxResults: Math.ceil(maxResults / (source === "all" ? 3 : 1)),
          source: "semantic-scholar",
        });
      } catch (error) {
        console.error("Semantic Scholar search error:", error);
        // Continue with other sources if Semantic Scholar fails
      }
    }

    // Search CrossRef
    if (source === "crossref" || source === "all") {
      try {
        const crossRefResults = await crossRefAPI.searchMedicalResearch(researchQuery.query, {
          limit: Math.ceil(maxResults / (source === "all" ? 3 : 1))
        });
        
        crossRefPapers = crossRefResults.map(work => ({
          id: work.DOI || `crossref-${Date.now()}-${Math.random()}`,
          doi: work.DOI,
          title: cleanupText(work.title?.[0] || 'Untitled'),
          abstract: cleanupText(work.abstract || ''),
          authors: work.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || ['Unknown Author'],
          journal: work['container-title']?.[0] || 'Unknown Journal',
          year: work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
          url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
          citationCount: work['is-referenced-by-count'] || 0,
          isOpenAccess: work.license ? work.license.length > 0 : false,
          type: work.type,
          publisher: work.publisher,
          volume: work.volume,
          issue: work.issue,
          pages: work.page
        }));
      } catch (error) {
        console.error("CrossRef search error:", error);
        // Continue with other sources if CrossRef fails
      }
    }

    // Combine and format results
    const combinedResults = [
      ...pubmedPapers.map(paper => ({
        id: paper.pmid,
        title: cleanupText(paper.title),
        authors: paper.authors,
        journal: paper.journal,
        year: new Date(paper.publishedDate).getFullYear(),
        pmid: paper.pmid,
        doi: paper.doi,
        url: paper.url,
        abstract: cleanupText(paper.abstract),
        source: "PubMed",
        confidenceScore: 85, // PubMed has high medical relevance
        evidenceLevel: 'High' as const,
        studyType: 'Journal Article' as const,
      })),
      ...semanticScholarPapers.map(paper => ({
        id: paper.paperId,
        title: cleanupText(paper.title),
        authors: paper.authors.map(author => author.name),
        journal: paper.venue,
        year: paper.year,
        doi: paper.doi,
        url: paper.url,
        abstract: cleanupText(paper.abstract),
        source: "Semantic Scholar",
        confidenceScore: 75, // Good for general academic research
        evidenceLevel: 'Moderate' as const,
        studyType: 'Journal Article' as const,
      })),
      ...crossRefPapers.map(paper => ({
        id: paper.id,
        title: cleanupText(paper.title),
        authors: paper.authors,
        journal: paper.journal,
        year: paper.year,
        doi: paper.doi,
        url: paper.url,
        abstract: cleanupText(paper.abstract || ''),
        source: "CrossRef",
        confidenceScore: paper.citationCount && paper.citationCount > 50 ? 90 : 
                       paper.citationCount && paper.citationCount > 10 ? 80 : 70,
        evidenceLevel: paper.citationCount && paper.citationCount > 50 ? 'High' as const :
                      paper.citationCount && paper.citationCount > 10 ? 'Moderate' as const : 'Low' as const,
        studyType: paper.type === 'journal-article' ? 'Journal Article' as const :
                  paper.type === 'proceedings-article' ? 'Observational' as const :
                  'Review' as const,
        citationCount: paper.citationCount,
        isOpenAccess: paper.isOpenAccess,
        volume: paper.volume,
        issue: paper.issue,
        pages: paper.pages,
        publisher: paper.publisher,
      })),
    ];

    // Sort by relevance/confidence score and year, then limit results
    const sortedResults = combinedResults
      .sort((a, b) => {
        // Sort by confidence score first, then by year
        const confidenceDiff = (b.confidenceScore || 70) - (a.confidenceScore || 70);
        if (confidenceDiff !== 0) return confidenceDiff;
        return b.year - a.year;
      })
      .slice(0, maxResults);

    return NextResponse.json({
      papers: sortedResults,
      totalFound: combinedResults.length,
      query: researchQuery.query,
      sources: {
        pubmed: pubmedPapers.length,
        semanticScholar: semanticScholarPapers.length,
        crossref: crossRefPapers.length,
      },
    });

  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Research API endpoint",
    methods: ["POST"],
    endpoints: {
      search: "/api/research",
    },
  });
}

// Helper functions for enhanced research analysis

// Enhanced search query builder for high-quality evidence
function buildHighQualitySearchQuery(originalQuery: string): string {
  const queryLower = originalQuery.toLowerCase();
  
  // Start with the original query and add basic quality filters
  let enhancedQuery = originalQuery;
  
  // Add human studies filter (basic quality improvement)
  enhancedQuery += ' AND (humans[mh])';
  
  // Add recent studies filter (last 10 years for more modern evidence)
  enhancedQuery += ' AND (2014:2024[dp])';
  
  // For migraine, add modern treatment terms
  if (queryLower.includes('migraine')) {
    enhancedQuery = `(${originalQuery}) OR (migraine AND (CGRP OR gepant OR ubrogepant OR rimegepant OR erenumab))`;
    enhancedQuery += ' AND (humans[mh]) AND (2014:2024[dp])';
  }
  
  return enhancedQuery;
}

// GRADE (Grading of Recommendations Assessment, Development and Evaluation) System
interface GRADEOutcome {
  outcome: string;
  grade: 'high' | 'moderate' | 'low' | 'veryLow';
  score: string;
  factors: {
    studyDesign: number;
    riskOfBias: number;
    inconsistency: number;
    indirectness: number;
    imprecision: number;
    publicationBias: number;
  };
  rationale: string;
}

function calculateGRADEScore(paper: any): GRADEOutcome[] {
  const outcomes: GRADEOutcome[] = [];
  
  // Identify potential outcomes from the paper
  const detectedOutcomes = detectClinicalOutcomes(paper.title, paper.abstract || '');
  
  for (const outcome of detectedOutcomes) {
    const gradeAssessment = assessGRADEFactors(paper, outcome);
    outcomes.push(gradeAssessment);
  }
  
  return outcomes.length > 0 ? outcomes : [createDefaultGRADEAssessment(paper)];
}

function detectClinicalOutcomes(title: string, abstract: string): string[] {
  const content = `${title} ${abstract}`.toLowerCase();
  const outcomes: string[] = [];
  
  // Primary efficacy outcomes
  const efficacyPatterns = [
    { pattern: /mortality|death|survival/i, outcome: 'Mortality' },
    { pattern: /efficacy|effectiveness|response rate/i, outcome: 'Efficacy' },
    { pattern: /symptom|pain|improvement/i, outcome: 'Symptom Relief' },
    { pattern: /progression|recurrence|relapse/i, outcome: 'Disease Progression' },
    { pattern: /function|mobility|activity/i, outcome: 'Functional Outcomes' }
  ];
  
  // Safety outcomes
  const safetyPatterns = [
    { pattern: /adverse|side effect|toxicity/i, outcome: 'Adverse Events' },
    { pattern: /safety|tolerability/i, outcome: 'Safety Profile' },
    { pattern: /discontinuation|withdrawal/i, outcome: 'Treatment Discontinuation' }
  ];
  
  // Quality of life outcomes
  const qolPatterns = [
    { pattern: /quality of life|qol|hrqol/i, outcome: 'Quality of Life' },
    { pattern: /patient satisfaction|patient preference/i, outcome: 'Patient Satisfaction' }
  ];
  
  const allPatterns = [...efficacyPatterns, ...safetyPatterns, ...qolPatterns];
  
  for (const { pattern, outcome } of allPatterns) {
    if (pattern.test(content) && !outcomes.includes(outcome)) {
      outcomes.push(outcome);
    }
  }
  
  return outcomes.length > 0 ? outcomes.slice(0, 3) : ['Primary Outcome']; // Limit to top 3
}

function assessGRADEFactors(paper: any, outcome: string): GRADEOutcome {
  let startingPoints = 0;
  
  // Starting points based on study design (more refined scoring)
  if (paper.studyType.includes('Meta-analysis') || paper.studyType.includes('Systematic Review')) {
    startingPoints = 4; // Start high for systematic reviews
    // Bonus for Cochrane reviews
    if (paper.source === 'Cochrane Library') {
      startingPoints = 4; // Cochrane maintains high starting point
    }
  } else if (paper.studyType.includes('RCT') || paper.studyType.includes('Randomized')) {
    startingPoints = 4; // RCTs start high
  } else if (paper.studyType.includes('Phase III Clinical Trial')) {
    startingPoints = 4; // Phase III trials are high quality
  } else if (paper.studyType.includes('Phase II Clinical Trial')) {
    startingPoints = 3; // Phase II trials are moderate-high quality
  } else if (paper.studyType.includes('Clinical Practice Guideline')) {
    startingPoints = 3; // Guidelines start moderate-high
  } else if (paper.source === 'NIH RePORTER') {
    if (paper.clinicalTrial) {
      // NIH clinical trials get high starting points
      if (paper.clinicalTrial.phase?.includes('Phase III') || paper.clinicalTrial.phase?.includes('Phase 3')) {
        startingPoints = 4; // Phase III NIH trials are high quality
      } else if (paper.clinicalTrial.phase?.includes('Phase II') || paper.clinicalTrial.phase?.includes('Phase 2')) {
        startingPoints = 3; // Phase II NIH trials are moderate-high quality
      } else {
        startingPoints = 2; // Early phase or unclear
      }
    } else if (paper.publications > 5) {
      startingPoints = 3; // Well-published NIH research gets moderate-high
    } else if (paper.publications > 0) {
      startingPoints = 2; // Some publications gets moderate
    } else {
      startingPoints = 1; // Research in progress gets lower score
    }
  } else if (paper.studyType.includes('Cohort') || paper.studyType.includes('Case-Control')) {
    startingPoints = 2; // Observational studies start low
  } else if (paper.studyType.includes('Case Series') || paper.studyType.includes('Case Report')) {
    startingPoints = 1; // Case series start very low
  } else {
    startingPoints = 2; // Default for unclear study types
  }
  
  const factors = {
    studyDesign: startingPoints,
    riskOfBias: 0,
    inconsistency: 0,
    indirectness: 0,
    imprecision: 0,
    publicationBias: 0
  };
  
  // Enhanced risk of bias assessment
  if (paper.source === 'Cochrane Library') {
    factors.riskOfBias = 0; // Cochrane reviews have rigorous bias assessment
  } else if (paper.source === 'Clinical Guidelines') {
    factors.riskOfBias = -0.25; // Guidelines have moderate bias assessment (better than default)
  } else if (paper.studyType.includes('Clinical Practice Guideline')) {
    factors.riskOfBias = -0.25; // Practice guidelines have structured methodology
  } else if (paper.source === 'NIH RePORTER') {
    if (paper.clinicalTrial) {
      factors.riskOfBias = -0.25; // NIH clinical trials have good oversight but some bias risk
    } else if (paper.publications > 3) {
      factors.riskOfBias = -0.5; // Published NIH research has moderate bias concerns
    } else {
      factors.riskOfBias = -1; // Ongoing/unpublished NIH research has higher bias risk
    }
  } else if (paper.evidenceLevel.includes('Level 1A') || paper.evidenceLevel.includes('Level 1B')) {
    factors.riskOfBias = 0; // Minimal bias concerns for highest level evidence
  } else if (paper.evidenceLevel.includes('Level 2')) {
    factors.riskOfBias = -0.5; // Some bias concerns
  } else if (paper.evidenceLevel.includes('Level 3')) {
    factors.riskOfBias = -1; // Moderate bias concerns
  } else {
    factors.riskOfBias = -1.5; // Serious bias concerns
  }
  
  // Inconsistency (heterogeneity) - improved assessment
  if (paper.studyType.includes('Meta-analysis')) {
    // Assume some heterogeneity but not serious if it's a Cochrane review
    factors.inconsistency = paper.source === 'Cochrane Library' ? -0.25 : -0.5;
  } else if (paper.studyType.includes('Systematic Review')) {
    factors.inconsistency = -0.25; // May have some inconsistent results
  } else {
    factors.inconsistency = 0; // Single studies don't have inconsistency issues
  }
  
  // Indirectness - enhanced assessment
  if (paper.relevanceScore > 0.8) {
    factors.indirectness = 0; // Directly relevant
  } else if (paper.relevanceScore > 0.6) {
    factors.indirectness = -0.25; // Somewhat indirect
  } else if (paper.relevanceScore > 0.4) {
    factors.indirectness = -0.5; // Moderately indirect
  } else {
    factors.indirectness = -1; // Seriously indirect evidence
  }
  
  // Imprecision - enhanced assessment
  const currentYear = new Date().getFullYear();
  const studyAge = currentYear - paper.year;
  const citationCount = paper.citationCount || 0;
  
  if (paper.source === 'Cochrane Library' || 
      (studyAge <= 5 && citationCount > 100) ||
      paper.studyType.includes('Phase III Clinical Trial')) {
    factors.imprecision = 0; // High precision studies
  } else if (paper.studyType.includes('Clinical Practice Guideline') && studyAge <= 5) {
    factors.imprecision = -0.25; // Recent guidelines have good precision
  } else if (studyAge <= 5 && citationCount > 50) {
    factors.imprecision = -0.25; // Minimal precision concerns
  } else if (studyAge <= 10 && citationCount > 20) {
    factors.imprecision = -0.5; // Some precision concerns
  } else {
    factors.imprecision = -1; // Serious precision concerns
  }
  
  // Publication bias - enhanced assessment
  if (paper.source === 'Cochrane Library' || paper.source === 'Clinical Guidelines') {
    factors.publicationBias = 0; // Systematic approaches minimize publication bias
  } else if (paper.source === 'NIH RePORTER') {
    if (paper.publications > 0) {
      factors.publicationBias = -0.25; // NIH projects with publications have lower bias risk
    } else {
      factors.publicationBias = -0.75; // Unpublished NIH research has higher publication bias risk
    }
  } else if (paper.studyType.includes('Meta-analysis') || paper.studyType.includes('Systematic Review')) {
    factors.publicationBias = -0.25; // Minimal risk in well-conducted reviews
  } else if (paper.studyType.includes('Phase III Clinical Trial') && paper.source === 'ClinicalTrials.gov') {
    factors.publicationBias = -0.25; // Registered trials have lower publication bias
  } else {
    factors.publicationBias = -0.5; // Risk of selective reporting
  }
  
  // Calculate final score with more nuanced thresholds
  const totalScore = startingPoints + Object.values(factors).slice(1).reduce((sum, val) => sum + val, 0);
  
  let grade: 'high' | 'moderate' | 'low' | 'veryLow';
  let scoreDisplay: string;
  let rationale: string;
  
  if (totalScore >= 3.5) {
    grade = 'high';
    scoreDisplay = '⭐⭐⭐⭐';
    rationale = 'High confidence that the true effect lies close to that of the estimate of the effect.';
  } else if (totalScore >= 2.5) {
    grade = 'moderate';
    scoreDisplay = '⭐⭐⭐⚪';
    rationale = 'Moderate confidence in the effect estimate. The true effect is likely close to the estimate, but there is a possibility that it is substantially different.';
  } else if (totalScore >= 1.5) {
    grade = 'low';
    scoreDisplay = '⭐⭐⚪⚪';
    rationale = 'Low confidence in the effect estimate. The true effect may be substantially different from the estimate.';
  } else {
    grade = 'veryLow';
    scoreDisplay = '⭐⚪⚪⚪';
    rationale = 'Very low confidence in the effect estimate. The true effect is likely to be substantially different from the estimate.';
  }
  
  return {
    outcome,
    grade,
    score: scoreDisplay,
    factors,
    rationale
  };
}

function createDefaultGRADEAssessment(paper: any): GRADEOutcome {
  return assessGRADEFactors(paper, 'Overall Effect');
}

function formatGRADEResults(gradeOutcomes: GRADEOutcome[]): string {
  if (!gradeOutcomes || gradeOutcomes.length === 0) return '';
  
  let gradeText = '\n**📊 GRADE Evidence Quality Assessment:**\n\n';
  
  gradeOutcomes.forEach((outcome, index) => {
    gradeText += `**${outcome.outcome}:** ${outcome.score} (${outcome.grade.toUpperCase()})  \n`;
    gradeText += `*${outcome.rationale}*\n\n`;
  });
  
  return gradeText;
}

// Create comprehensive GRADE summary table with visual indicators
function createGRADESummaryTable(papers: any[], query: string): string {
  const queryLower = query.toLowerCase();
  let table = '';
  
  // Define key clinical outcomes based on query
  const outcomes = getRelevantOutcomes(queryLower);
  
  // Create header
  table += `| Outcome | Evidence Quality | Papers | Key Findings | Clinical Confidence |\n`;
  table += `|---------|------------------|--------|--------------|---------------------|\n`;
  
  outcomes.forEach(outcome => {
    const relevantPapers = papers.filter(paper => 
      isRelevantToOutcome(paper, outcome.name, queryLower)
    );
    
    if (relevantPapers.length > 0) {
      const avgGrade = calculateAverageGRADE(relevantPapers, outcome.name);
      const confidence = getConfidenceIndicator(avgGrade);
      const keyFindings = generateOutcomeFindings(relevantPapers, outcome.name);
      
      table += `| ${outcome.icon} ${outcome.name} | ${avgGrade.score} ${avgGrade.grade.toUpperCase()} | ${relevantPapers.length} | ${keyFindings} | ${confidence} |\n`;
    }
  });
  
  table += '\n**Legend:**\n';
  table += '- ⭐⭐⭐⭐ HIGH: Strong recommendation, high confidence\n';
  table += '- ⭐⭐⭐⚪ MODERATE: Strong recommendation, moderate confidence\n';
  table += '- ⭐⭐⚪⚪ LOW: Weak recommendation, low confidence\n';
  table += '- ⭐⚪⚪⚪ VERY LOW: Very weak recommendation, very low confidence\n\n';
  
  // Add visual confidence indicators
  const overallGrade = calculateOverallGRADE(papers);
  table += `**Overall Evidence Confidence:** ${getVisualConfidenceIndicator(overallGrade)} ${overallGrade.toUpperCase()}\n\n`;
  
  return table;
}

function getRelevantOutcomes(queryLower: string): Array<{name: string, icon: string}> {
  const outcomes = [
    { name: 'Efficacy', icon: '🎯' },
    { name: 'Safety', icon: '🛡️' },
    { name: 'Tolerability', icon: '⚖️' },
    { name: 'Quality of Life', icon: '💝' },
    { name: 'Cost-Effectiveness', icon: '💰' }
  ];
  
  // Add disease-specific outcomes
  if (queryLower.includes('migraine')) {
    outcomes.push(
      { name: 'Pain Relief', icon: '⚡' },
      { name: 'Prevention', icon: '🛡️' },
      { name: 'Functional Disability', icon: '🏃‍♂️' }
    );
  }
  
  if (queryLower.includes('diabetes')) {
    outcomes.push(
      { name: 'Glycemic Control', icon: '📊' },
      { name: 'Cardiovascular Outcomes', icon: '❤️' },
      { name: 'Weight Management', icon: '⚖️' }
    );
  }
  
  return outcomes.slice(0, 6); // Limit to most relevant outcomes
}

function isRelevantToOutcome(paper: any, outcome: string, query: string): boolean {
  const content = `${paper.title} ${paper.abstract || ''}`.toLowerCase();
  const outcomeLower = outcome.toLowerCase();
  
  if (outcomeLower.includes('efficacy')) {
    return content.includes('efficacy') || content.includes('effectiveness') || content.includes('response');
  }
  if (outcomeLower.includes('safety')) {
    return content.includes('safety') || content.includes('adverse') || content.includes('side effect');
  }
  if (outcomeLower.includes('pain')) {
    return content.includes('pain') || content.includes('relief') || content.includes('reduction');
  }
  if (outcomeLower.includes('prevention')) {
    return content.includes('prevention') || content.includes('prophylaxis') || content.includes('preventive');
  }
  
  return true; // Default to include for general outcomes
}

function calculateAverageGRADE(papers: any[], outcome: string): {grade: string, score: string} {
  if (papers.length === 0) return {grade: 'veryLow', score: '⭐⚪⚪⚪'};
  
  const grades = papers.map(paper => {
    const gradeOutcomes = calculateGRADEScore(paper);
    const relevantGrade = gradeOutcomes.find(g => g.outcome === outcome) || gradeOutcomes[0];
    return gradeToNumber(relevantGrade.grade);
  });
  
  const avgGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
  
  if (avgGrade >= 3.5) return {grade: 'high', score: '⭐⭐⭐⭐'};
  if (avgGrade >= 2.5) return {grade: 'moderate', score: '⭐⭐⭐⚪'};
  if (avgGrade >= 1.5) return {grade: 'low', score: '⭐⭐⚪⚪'};
  return {grade: 'veryLow', score: '⭐⚪⚪⚪'};
}

function gradeToNumber(grade: string): number {
  switch (grade) {
    case 'high': return 4;
    case 'moderate': return 3;
    case 'low': return 2;
    case 'veryLow': return 1;
    default: return 1;
  }
}

function generateOutcomeFindings(papers: any[], outcome: string): string {
  const highQualityPapers = papers.filter(p => 
    p.evidenceLevel.includes('Level 1') || p.evidenceLevel.includes('Level 2')
  );
  
  if (highQualityPapers.length > 0) {
    return `Strong evidence from ${highQualityPapers.length} high-quality studies`;
  } else if (papers.length > 2) {
    return `Moderate evidence from ${papers.length} studies`;
  } else {
    return `Limited evidence from ${papers.length} study(ies)`;
  }
}

function getConfidenceIndicator(gradeInfo: {grade: string, score: string}): string {
  switch (gradeInfo.grade) {
    case 'high': return '🟢 Strong';
    case 'moderate': return '🟡 Moderate';
    case 'low': return '🟠 Weak';
    case 'veryLow': return '🔴 Very Weak';
    default: return '⚪ Unclear';
  }
}

function calculateOverallGRADE(papers: any[]): string {
  if (papers.length === 0) return 'veryLow';
  
  const highQualityPapers = papers.filter(p => 
    p.evidenceLevel.includes('Level 1') || 
    p.studyType.includes('Meta-analysis') || 
    p.studyType.includes('Systematic Review') ||
    p.source === 'Cochrane Library'
  ).length;
  
  const moderateQualityPapers = papers.filter(p => 
    p.evidenceLevel.includes('Level 2') ||
    p.studyType.includes('RCT')
  ).length;
  
  if (highQualityPapers >= 2) return 'high';
  if (highQualityPapers >= 1 || moderateQualityPapers >= 2) return 'moderate';
  if (moderateQualityPapers >= 1) return 'low';
  return 'veryLow';
}

function getVisualConfidenceIndicator(grade: string): string {
  switch (grade) {
    case 'high': return '🟢🟢🟢🟢';
    case 'moderate': return '🟡🟡🟡⚪';
    case 'low': return '🟠🟠⚪⚪';
    case 'veryLow': return '🔴⚪⚪⚪';
    default: return '⚪⚪⚪⚪';
  }
}

// Simple string similarity using Levenshtein distance
function calculateStringsimilarities(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len1][len2]) / maxLen;
}

// Clean up text by removing XML/HTML tags and normalizing whitespace
function cleanupText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove XML/HTML tags (including jats: tags)
    .replace(/<[^>]*>/g, '')
    // Remove specific JATS/XML tags that might not be caught above
    .replace(/<\/?jats:[^>]*>/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim()
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function calculateRelevanceScore(title: string, abstract: string, query: string): number {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  const content = `${title} ${abstract}`.toLowerCase();
  
  // Biomedical domain filtering - reject papers from non-medical fields
  const nonMedicalKeywords = [
    'computational chemistry', 'density functional theory', 'quantum chemistry', 
    'polymer', 'catalyst', 'synthesis', 'chemical reaction', 'molecular dynamics',
    'materials science', 'physics', 'engineering', 'computer science', 'semiempirical',
    'gga-type density functional', 'dispersion correction', 'b97-d', 'dft',
    'quantum mechanics', 'ab initio', 'theoretical chemistry', 'surface chemistry',
    'crystallography', 'spectroscopy', 'nmr', 'infrared', 'raman', 'mass spectrometry',
    'chromatography', 'analytical chemistry', 'inorganic chemistry', 'organic chemistry',
    'many-electron systems', 'approximation treatment', 'electron', 'molecular orbital',
    'hartree-fock', 'schrödinger equation', 'wave function', 'quantum theory'
  ];
  
  const isBiomedical = checkBiomedicalRelevance(title, abstract);
  if (!isBiomedical || nonMedicalKeywords.some(keyword => content.includes(keyword))) {
    return 0; // Completely filter out non-medical papers
  }
  
  let score = 0;
  let querySpecificTerms = 0;
  
  // Check for exact query-specific matches first
  searchTerms.forEach(term => {
    if (content.includes(term)) {
      score += 0.3;
      querySpecificTerms++;
    }
    // Bonus for title matches
    if (title.toLowerCase().includes(term)) {
      score += 0.2;
    }
  });
  
  // Enhanced specificity check: require at least 10% of query terms to match (reduced for more inclusivity)
  const queryTermsRatio = querySpecificTerms / searchTerms.length;
  if (queryTermsRatio < 0.1) {
    return 0; // Not specific enough to the query
  }
  
  // Bonus for treatment-focused studies
  const treatmentKeywords = [
    'treatment', 'therapy', 'intervention', 'drug', 'medication', 'clinical trial',
    'randomized', 'placebo', 'efficacy', 'safety', 'adverse', 'side effect',
    'prophylaxis', 'prevention', 'management', 'guideline', 'recommendation',
    'therapeutic', 'pharmacotherapy', 'protocol', 'dose', 'dosing'
  ];
  
  const treatmentMatches = treatmentKeywords.filter(keyword => content.includes(keyword)).length;
  if (treatmentMatches >= 2) {
    score += 0.3; // Increased bonus for treatment-focused papers
  }
  
  // Extra bonus for specific migraine treatments when querying migraine
  if (query.toLowerCase().includes('migraine')) {
    const migraineTreatments = [
      'cgrp', 'erenumab', 'fremanezumab', 'galcanezumab', 'ubrogepant', 'rimegepant',
      'gepant', 'triptan', 'sumatriptan', 'topiramate', 'propranolol', 'botox',
      'neuromodulation', 'transcranial', 'onabotulinum'
    ];
    
    const migTreatmentMatches = migraineTreatments.filter(keyword => content.includes(keyword)).length;
    if (migTreatmentMatches >= 1) {
      score += 0.4; // Strong bonus for specific migraine treatments
    }
  }
  
  // Strong penalty for purely epidemiological studies when query is about treatment
  if (query.toLowerCase().includes('treatment') || query.toLowerCase().includes('therapy') || 
      query.toLowerCase().includes('prevention') || query.toLowerCase().includes('management') ||
      query.toLowerCase().includes('latest')) {
    const epidemiologicalKeywords = [
      'burden of disease', 'epidemiology', 'prevalence', 'incidence', 'mortality',
      'global burden', 'years lived with disability', 'disability-adjusted life years',
      'systematic analysis for the global burden', 'gbd study', 'global health metrics',
      'disease burden', 'population health', 'health statistics'
    ];
    
    const hasEpidemiological = epidemiologicalKeywords.some(keyword => content.includes(keyword));
    const hasTreatment = treatmentKeywords.some(keyword => content.includes(keyword));
    
    // Specifically filter out Global Burden of Disease studies when asking about treatments
    if (title.toLowerCase().includes('global burden of disease') || 
        title.toLowerCase().includes('gbd study') ||
        (hasEpidemiological && !hasTreatment)) {
      return 0; // Completely exclude epidemiological studies when treatment is requested
    }
  }
  
  // Additional scoring for medical relevance
  const medicalTermBonus = getMedicalTermBonus(content, query);
  score += medicalTermBonus;
  
  // Penalty for generic medical papers that don't match the specific condition
  const penaltyScore = applyGenericMedicalPenalty(content, query);
  score = Math.max(0, score - penaltyScore);
  
  return Math.min(score, 1.0);
}

function applyGenericMedicalPenalty(content: string, query: string): number {
  const queryLower = query.toLowerCase();
  
  // If query is about a specific condition, penalize papers about other conditions
  const conditionMap = {
    'migraine': ['diabetes', 'hypertension', 'blood pressure', 'cholesterol', 'cardiac', 'heart disease'],
    'diabetes': ['migraine', 'headache', 'cancer', 'cardiovascular'],
    'hypertension': ['migraine', 'diabetes', 'cancer'],
    'cancer': ['migraine', 'diabetes', 'hypertension'],
    'depression': ['migraine', 'diabetes', 'hypertension', 'cancer']
  };
  
  for (const [condition, unrelatedTerms] of Object.entries(conditionMap)) {
    if (queryLower.includes(condition)) {
      for (const unrelated of unrelatedTerms) {
        if (content.includes(unrelated) && !content.includes(condition)) {
          return 0.7; // Heavy penalty for papers about different conditions
        }
      }
    }
  }
  
  return 0; // No penalty
}

function checkBiomedicalRelevance(title: string, abstract: string): boolean {
  const content = `${title} ${abstract}`.toLowerCase();
  
  // Core biomedical keywords (more comprehensive)
  const biomedicalKeywords = [
    // Core medical terms
    'patient', 'clinical', 'medical', 'therapy', 'treatment', 'disease', 'diagnosis',
    'healthcare', 'medicine', 'pharmaceutical', 'drug', 'hospital', 'therapeutic',
    'epidemiology', 'pathology', 'physiology', 'anatomy', 'surgery', 'nursing',
    
    // Disease categories
    'diabetes', 'hypertension', 'cancer', 'cardiovascular', 'respiratory', 'neurological',
    'oncology', 'cardiology', 'neurology', 'gastroenterology', 'dermatology', 'psychiatry',
    'orthopedics', 'endocrinology', 'infectious', 'immunology', 'hematology', 'nephrology',
    
    // Clinical research terms
    'randomized', 'placebo', 'trial', 'cohort', 'case-control', 'meta-analysis',
    'systematic review', 'evidence-based', 'clinical trial', 'intervention', 'outcome',
    'efficacy', 'safety', 'adverse', 'side effect', 'dosage', 'administration',
    
    // Anatomical and physiological terms
    'blood', 'serum', 'plasma', 'tissue', 'organ', 'cell', 'molecular', 'genetic',
    'protein', 'enzyme', 'hormone', 'receptor', 'metabolism', 'immune', 'inflammatory',
    'vascular', 'cardiac', 'pulmonary', 'renal', 'hepatic', 'cerebral', 'spinal',
    
    // Healthcare delivery
    'health outcomes', 'quality of life', 'mortality', 'morbidity', 'prognosis',
    'screening', 'prevention', 'public health', 'health policy', 'cost-effectiveness',
    
    // Pharmaceutical terms
    'pharmacokinetics', 'pharmacodynamics', 'bioavailability', 'half-life', 'clearance',
    'contraindication', 'indication', 'prescription', 'over-the-counter', 'generic'
  ];
  
  // Reduced threshold - require at least 1 biomedical term for relevance
  const matches = biomedicalKeywords.filter(keyword => content.includes(keyword)).length;
  return matches >= 1;
}

function getMedicalTermBonus(content: string, query: string): number {
  const queryLower = query.toLowerCase();
  let bonus = 0;
  
  // Diabetes-specific terms
  if (queryLower.includes('diabetes')) {
    const diabetesTerms = [
      'glp-1', 'semaglutide', 'sglt2', 'metformin', 'insulin', 'glucose',
      'hemoglobin a1c', 'hba1c', 'glycemic control', 'beta cells'
    ];
    diabetesTerms.forEach(term => {
      if (content.includes(term)) bonus += 0.1;
    });
  }
  
  // Hypertension-specific terms
  if (queryLower.includes('hypertension') || queryLower.includes('blood pressure')) {
    const bpTerms = [
      'ace inhibitor', 'arb', 'beta blocker', 'calcium channel blocker',
      'diuretic', 'systolic', 'diastolic', 'antihypertensive'
    ];
    bpTerms.forEach(term => {
      if (content.includes(term)) bonus += 0.1;
    });
  }
  
  return Math.min(bonus, 0.3);
}

function inferStudyType(title: string, abstract: string): string {
  const content = `${title} ${abstract}`.toLowerCase();
  
  // Clinical guidelines and practice recommendations
  if (content.includes('clinical guideline') || content.includes('practice guideline') || 
      content.includes('consensus statement') || content.includes('recommendation') || 
      content.includes('clinical practice') || title.toLowerCase().includes('guideline')) {
    return 'Clinical Practice Guideline';
  }
  
  // Phase-specific clinical trials
  if (content.includes('phase iii') || content.includes('phase 3')) {
    return 'Phase III Clinical Trial';
  }
  if (content.includes('phase ii') || content.includes('phase 2')) {
    return 'Phase II Clinical Trial';
  }
  if (content.includes('phase i') || content.includes('phase 1')) {
    return 'Phase I Clinical Trial';
  }
  if (content.includes('phase iv') || content.includes('phase 4')) {
    return 'Phase IV Clinical Trial';
  }
  
  // More specific pattern matching for study types
  if (content.includes('randomized controlled trial') || content.includes('randomised controlled trial') || content.includes(' rct ')) {
    return 'Randomized Controlled Trial (RCT)';
  }
  if (content.includes('meta-analysis') && content.includes('systematic review')) {
    return 'Systematic Review & Meta-analysis';
  }
  if (content.includes('systematic review')) {
    return 'Systematic Review';
  }
  if (content.includes('meta-analysis')) {
    return 'Meta-analysis';
  }
  if (content.includes('double-blind') || content.includes('placebo-controlled')) {
    return 'Randomized Controlled Trial (RCT)';
  }
  if (content.includes('cohort study') || content.includes('prospective study')) {
    return 'Prospective Cohort Study';
  }
  if (content.includes('case-control study')) {
    return 'Case-Control Study';
  }
  if (content.includes('cross-sectional study')) {
    return 'Cross-sectional Study';
  }
  if (content.includes('clinical trial') && !content.includes('randomized')) {
    return 'Clinical Trial';
  }
  if (content.includes('observational study')) {
    return 'Observational Study';
  }
  if (content.includes('review') && !content.includes('systematic')) {
    return 'Narrative Review';
  }
  return 'Research Article';
}

function inferEvidenceLevel(title: string, abstract: string): string {
  const content = `${title} ${abstract}`.toLowerCase();
  
  // Clinical guidelines - evidence level depends on supporting evidence
  if (content.includes('clinical guideline') || content.includes('practice guideline') || 
      content.includes('consensus statement') || title.toLowerCase().includes('guideline')) {
    if (content.includes('evidence-based') || content.includes('systematic review')) {
      return 'Level 1B (Very High)'; // Evidence-based guidelines
    }
    return 'Level 3A (Moderate)'; // Expert consensus guidelines
  }
  
  // Systematic reviews and meta-analyses (highest evidence)
  if (content.includes('systematic review') && content.includes('meta-analysis')) {
    return 'Level 1A (Highest)';
  }
  if (content.includes('systematic review')) {
    return 'Level 1B (Very High)';
  }
  
  // Clinical trials by phase
  if (content.includes('phase iii') || content.includes('phase 3')) {
    return 'Level 2 (High)'; // Phase III trials are high evidence
  }
  if (content.includes('phase ii') || content.includes('phase 2')) {
    return 'Level 3A (Moderate)'; // Phase II trials are moderate evidence
  }
  if (content.includes('phase i') || content.includes('phase 1') || 
      content.includes('phase iv') || content.includes('phase 4')) {
    return 'Level 4 (Low-Moderate)'; // Phase I and IV are lower evidence for efficacy
  }
  
  // Standard RCTs
  if (content.includes('randomized controlled trial') || content.includes('randomised controlled trial') || content.includes(' rct ')) {
    return 'Level 2 (High)';
  }
  
  // Observational studies
  if (content.includes('cohort study') || content.includes('prospective')) {
    return 'Level 3A (Moderate)';
  }
  if (content.includes('case-control')) {
    return 'Level 3B (Moderate)';
  }
  if (content.includes('cross-sectional')) {
    return 'Level 4 (Low-Moderate)';
  }
  if (content.includes('case series') || content.includes('case report')) {
    return 'Level 5 (Low)';
  }
  if (content.includes('expert opinion') || (content.includes('review') && !content.includes('systematic'))) {
    return 'Level 5 (Expert Opinion)';
  }
  return 'Level 4 (Low-Moderate)';
}

function generateClinicalInsight(paper: any, query: string): string {
  const title = paper.title.toLowerCase();
  const abstract = (paper.abstract || '').toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Migraine-specific insights with newer treatments
  if (queryLower.includes('migraine') || title.includes('migraine')) {
    if (title.includes('cgrp') || abstract.includes('cgrp') || 
        title.includes('erenumab') || title.includes('fremanezumab') || title.includes('galcanezumab') ||
        abstract.includes('calcitonin gene-related peptide')) {
      return 'Advances CGRP-targeted therapy — represents breakthrough in migraine prevention with targeted mechanism and improved tolerability profile.';
    }
    if (title.includes('gepant') || title.includes('ubrogepant') || title.includes('rimegepant') ||
        abstract.includes('cgrp receptor antagonist')) {
      return 'Supports oral CGRP receptor antagonists — offers novel acute treatment option with reduced cardiovascular contraindications compared to triptans.';
    }
    if (title.includes('prevention') || title.includes('prophylaxis') || abstract.includes('preventive')) {
      return 'Highlights prophylactic treatment strategies — supports early intervention with topiramate, propranolol, divalproex, or newer CGRP monoclonal antibodies for migraine prevention.';
    }
    if (title.includes('acute') || title.includes('triptan') || abstract.includes('sumatriptan')) {
      return 'Supports early attack-phase use of triptans, NSAIDs, or CGRP receptor antagonists to improve treatment effectiveness and cost-efficiency.';
    }
    if (title.includes('mechanism') || title.includes('pathophysiology') || abstract.includes('hyperexcitability')) {
      return 'Identifies CNS hyperexcitability and CGRP pathway as therapeutic targets — provides mechanistic support for preventive pharmacotherapy.';
    }
    if (title.includes('cost') || abstract.includes('economic')) {
      return 'Demonstrates cost-effectiveness of early migraine intervention including newer targeted therapies — supports healthcare resource optimization strategies.';
    }
    return 'Contributes evidence for comprehensive migraine management protocols and treatment individualization, including consideration of newer CGRP-targeted therapies.';
  }
  
  // Diabetes-specific insights
  if (queryLower.includes('diabetes')) {
    if (title.includes('semaglutide') || abstract.includes('semaglutide')) {
      return 'Provides evidence for semaglutide (GLP-1 agonist) effectiveness in diabetes management and cardiovascular protection.';
    }
    if (title.includes('sglt2') || abstract.includes('sglt2')) {
      return 'Demonstrates SGLT2 inhibitor benefits for cardiovascular outcomes and kidney protection in diabetes.';
    }
    if (title.includes('metformin') || abstract.includes('metformin')) {
      return 'Confirms metformin as evidence-based first-line therapy with established safety profile for type 2 diabetes.';
    }
    if (title.includes('insulin') || abstract.includes('insulin')) {
      return 'Informs optimal insulin therapy protocols and timing strategies in diabetes progression management.';
    }
    if (title.includes('lifestyle') || abstract.includes('diet') || abstract.includes('exercise')) {
      return 'Reinforces lifestyle interventions as foundational diabetes management — supports structured behavioral programs.';
    }
    return 'Contributes to evidence base for comprehensive diabetes care and personalized treatment optimization.';
  }
  
  // Hypertension insights
  if (queryLower.includes('hypertension') || queryLower.includes('blood pressure')) {
    if (title.includes('ace inhibitor') || abstract.includes('ace inhibitor')) {
      return 'Supports ACE inhibitors as first-line therapy with cardiovascular protective benefits beyond blood pressure control.';
    }
    if (title.includes('combination therapy') || abstract.includes('combination')) {
      return 'Demonstrates benefits of combination antihypertensive therapy for achieving target blood pressure goals.';
    }
    return 'Provides evidence for blood pressure management strategies and cardiovascular risk reduction protocols.';
  }
  
  // Generic insights based on study type and evidence level
  if (paper.studyType.includes('Clinical Practice Guideline')) {
    return 'Provides authoritative clinical recommendations — essential for standardizing evidence-based practice and improving patient outcomes.';
  }
  if (paper.studyType.includes('Phase III Clinical Trial')) {
    return 'Delivers definitive efficacy evidence — critical for regulatory approval and clinical decision-making about new treatments.';
  }
  if (paper.studyType.includes('Phase II Clinical Trial')) {
    return 'Provides promising preliminary efficacy data — important for treatment development and future large-scale studies.';
  }
  if (paper.studyType.includes('Phase I Clinical Trial')) {
    return 'Establishes safety profile and dosing guidelines — foundational for treatment development and risk assessment.';
  }
  if (paper.studyType.includes('Meta-analysis')) {
    return 'Provides highest-level evidence synthesis — ideal for clinical guideline development and practice recommendations.';
  }
  if (paper.studyType.includes('Systematic Review')) {
    return 'Offers comprehensive evidence evaluation — supports evidence-based clinical decision frameworks.';
  }
  if (paper.studyType.includes('RCT')) {
    return 'Delivers high-quality interventional evidence — directly applicable to treatment efficacy and safety assessment.';
  }
  if (paper.studyType.includes('Cohort')) {
    return 'Provides longitudinal evidence for disease progression — valuable for prognosis and long-term outcome prediction.';
  }
  
  // Source-specific insights
  if (paper.source === 'Cochrane Library') {
    return 'Gold-standard systematic evidence — represents the highest quality research synthesis available for clinical decision-making.';
  }
  if (paper.source === 'Trip Database') {
    return 'Pre-filtered evidence-based research — selected for clinical relevance and practical application in healthcare settings.';
  }
  if (paper.source === 'ClinicalTrials.gov') {
    return 'Official trial registry data — provides transparency about ongoing research and completed studies with regulatory oversight.';
  }
  if (paper.source === 'Clinical Guidelines') {
    return 'Expert consensus recommendations — synthesizes current evidence into actionable clinical practice standards.';
  }
  if (paper.source === 'NIH RePORTER') {
    if (paper.publications > 0) {
      return `NIH-funded research with ${paper.publications} publications — demonstrates federal investment in advancing medical knowledge with measurable scientific impact.`;
    }
    if (paper.clinicalTrial) {
      return `NIH-funded clinical research (${paper.clinicalTrial.phase || 'ongoing'}) — represents federally-supported investigation into new treatments with regulatory pathway.`;
    }
    if (paper.awardAmount && paper.awardAmount > 1000000) {
      return `Major NIH research initiative (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(paper.awardAmount)}) — indicates significant federal commitment to advancing this research area.`;
    }
    return 'NIH-funded research project — represents peer-reviewed, federally-supported investigation contributing to medical knowledge advancement.';
  }
  
  return 'Contributes valuable evidence for clinical decision-making and evidence-based practice protocols.';
}

function generatePlainLanguageSummary(abstract: string, query: string): string {
  if (!abstract || abstract.length < 50) {
    return generateFallbackSummary(query);
  }
  
  // Use our standardized cleanup function
  const cleanedAbstract = cleanupText(abstract);
  
  // Extract key findings using pattern matching instead of truncation
  const keyFindings = extractKeyFindings(cleanedAbstract);
  
  if (keyFindings.length > 0) {
    // Generate a coherent summary from key findings
    let summary = keyFindings.join('. ') + '.';
    
    // Simplify medical jargon
    summary = summary
      .replace(/\b(efficacy|effectiveness)\b/gi, 'how well the treatment works')
      .replace(/\b(adverse events|adverse effects)\b/gi, 'side effects')
      .replace(/\b(randomized controlled trial|RCT)\b/gi, 'controlled study')
      .replace(/\b(meta-analysis)\b/gi, 'analysis combining multiple studies')
      .replace(/\b(systematic review)\b/gi, 'comprehensive review of research')
      .replace(/\b(statistically significant)\b/gi, 'meaningful difference')
      .replace(/\b(placebo)\b/gi, 'inactive treatment')
      .replace(/\b(intervention)\b/gi, 'treatment')
      .replace(/\b(participants|subjects)\b/gi, 'patients')
      .replace(/\b(demonstrated|showed)\b/gi, 'found')
      .replace(/\b(conclude|concluded)\b/gi, 'found');
    
    return summary;
  }
  
  // Fallback to intelligent truncation with proper ending
  return createIntelligentSummary(cleanedAbstract);
}

function extractKeyFindings(abstract: string): string[] {
  const findings: string[] = [];
  const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Look for sentences with key result indicators
  const resultKeywords = [
    'showed', 'demonstrated', 'found', 'revealed', 'indicated', 'concluded',
    'reduced', 'increased', 'improved', 'decreased', 'significant', 'effective',
    'associated with', 'resulted in', 'compared to', 'vs', 'versus'
  ];
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 20) continue;
    
    // Check if sentence contains result keywords
    const hasResultKeyword = resultKeywords.some(keyword => 
      trimmed.toLowerCase().includes(keyword)
    );
    
    if (hasResultKeyword) {
      findings.push(trimmed);
    }
    
    // Stop after finding 2-3 key findings to keep summary concise
    if (findings.length >= 3) break;
  }
  
  return findings;
}

function createIntelligentSummary(abstract: string): string {
  // Find the best stopping point to avoid trailing off
  const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let summary = '';
  
  for (let i = 0; i < Math.min(sentences.length, 3); i++) {
    const sentence = sentences[i].trim();
    if ((summary + sentence).length > 250) {
      // If adding this sentence would make it too long, stop here with proper ending
      if (summary.length > 100) {
        summary += '. This study provides evidence for clinical decision-making.';
        break;
      }
    }
    summary += sentence + '. ';
  }
  
  return summary.trim() || 'This research contributes to the understanding of medical treatment approaches.';
}

function generateFallbackSummary(query: string): string {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('diabetes')) {
    return 'This study examines diabetes treatment approaches, including medications like metformin, GLP-1 agonists (semaglutide), SGLT2 inhibitors, and lifestyle interventions for blood sugar control and complication prevention.';
  }
  
  if (queryLower.includes('hypertension') || queryLower.includes('blood pressure')) {
    return 'This research investigates blood pressure management strategies, including ACE inhibitors, beta blockers, lifestyle modifications, and combination therapies for cardiovascular risk reduction.';
  }
  
  return 'This study provides clinical evidence relevant to the treatment and management of the specified medical condition.';
}

function assessOverallQuality(papers: any[]): string {
  const metaAnalyses = papers.filter(p => p.studyType.includes('Meta-analysis')).length;
  const systematicReviews = papers.filter(p => p.studyType.includes('Systematic Review')).length;
  const rcts = papers.filter(p => p.studyType.includes('RCT')).length;
  const recentPapers = papers.filter(p => p.year >= 2020).length;
  const level1Evidence = papers.filter(p => p.evidenceLevel.includes('Level 1')).length;
  const level2Evidence = papers.filter(p => p.evidenceLevel.includes('Level 2')).length;
  
  if (metaAnalyses >= 2 || level1Evidence >= 2) {
    return 'Excellent - Multiple high-quality systematic reviews/meta-analyses available';
  }
  if (metaAnalyses >= 1 || systematicReviews >= 1) {
    return 'Very Good - Systematic evidence synthesis available';
  }
  if (rcts >= 2 || level2Evidence >= 2) {
    return 'Good - Multiple randomized controlled trials provide solid evidence';
  }
  if (rcts >= 1 || recentPapers >= 2) {
    return 'Moderate - Some high-quality evidence available';
  }
  return 'Limited - Few high-quality studies found, consider broader search';
}

function calculateSearchCoverage(totalPapersScanned: number, query: string): number {
  // Assess how comprehensive our database search was
  let coverage = 0;
  
  // Base coverage from number of papers found across all APIs
  if (totalPapersScanned >= 20) coverage += 30; // Excellent coverage
  else if (totalPapersScanned >= 15) coverage += 25; // Good coverage
  else if (totalPapersScanned >= 10) coverage += 20; // Moderate coverage
  else if (totalPapersScanned >= 5) coverage += 15; // Limited coverage
  else coverage += 10; // Poor coverage
  
  // Bonus for multiple database coverage (we use 10 APIs)
  coverage += 30; // Multi-database bonus (increased for 10 APIs)
  
  // Query-specific adjustments
  const queryLower = query.toLowerCase();
  if (queryLower.includes('diabetes') || queryLower.includes('hypertension')) {
    coverage += 10; // Well-researched conditions
  }
  if (queryLower.includes('rare') || queryLower.length > 100) {
    coverage -= 15; // Specialized/complex queries may have limited coverage
  }
  
  return Math.min(Math.max(coverage, 30), 85); // Cap between 30-85%
}

function getEvidenceLevelWeight(evidenceLevel: string): number {
  // Strongly prioritize high-quality evidence
  if (evidenceLevel.includes('Level 1A')) return 100; // Meta-analysis + Systematic Review
  if (evidenceLevel.includes('Level 1B')) return 90;  // Systematic Review
  if (evidenceLevel.includes('Level 2')) return 75;   // RCTs
  if (evidenceLevel.includes('Level 3A')) return 50;  // Cohort studies
  if (evidenceLevel.includes('Level 3B')) return 45;  // Case-control
  if (evidenceLevel.includes('Level 4')) return 25;   // Cross-sectional
  if (evidenceLevel.includes('Level 5')) return 10;   // Case series, expert opinion
  return 5; // Default for unknown levels
}

function isBiomedicalPaper(title: string, abstract: string, query: string): boolean {
  const content = `${title} ${abstract}`.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Medical keywords that indicate biomedical relevance
  const medicalKeywords = [
    'patient', 'clinical', 'medical', 'health', 'disease', 'treatment', 'therapy',
    'diagnosis', 'symptom', 'drug', 'medication', 'hospital', 'healthcare',
    'randomized', 'trial', 'study', 'research', 'outcome', 'efficacy', 'safety',
    'adverse', 'effect', 'mortality', 'morbidity', 'prevalence', 'incidence',
    'epidemiological', 'pathophysiology', 'pharmaceutical', 'therapeutic',
    'intervention', 'prognosis', 'diagnostic', 'screening', 'prevention'
  ];
  
  // Computer science/engineering keywords that suggest non-medical content
  const nonMedicalKeywords = [
    'algorithm', 'software', 'computer', 'programming', 'database', 'network',
    'machine learning', 'artificial intelligence', 'data mining', 'optimization',
    'simulation', 'model', 'framework', 'architecture', 'protocol', 'system',
    'engineering', 'mechanical', 'electrical', 'physics', 'chemistry'
  ];
  
  // Count medical vs non-medical keyword matches
  const medicalMatches = medicalKeywords.filter(keyword => content.includes(keyword)).length;
  const nonMedicalMatches = nonMedicalKeywords.filter(keyword => content.includes(keyword)).length;
  
  // Check if query itself contains medical terms
  const queryMedicalMatches = medicalKeywords.filter(keyword => queryLower.includes(keyword)).length;
  
  // Strong medical context required - more inclusive
  return (medicalMatches >= 1 || queryMedicalMatches >= 1) && nonMedicalMatches <= medicalMatches;
}

function getEvidenceIcon(evidenceLevel: string): string {
  if (evidenceLevel.includes('Level 1A')) return '🏆'; // Gold standard
  if (evidenceLevel.includes('Level 1B')) return '🥇'; // Very high quality
  if (evidenceLevel.includes('Level 2')) return '🔬'; // High quality RCTs
  if (evidenceLevel.includes('Level 3A')) return '📊'; // Good quality cohort
  if (evidenceLevel.includes('Level 3B')) return '📈'; // Case-control
  if (evidenceLevel.includes('Level 4')) return '📋'; // Cross-sectional
  if (evidenceLevel.includes('Level 5')) return '📝'; // Case series/expert opinion
  return '❓'; // Unknown
}

function getSourceIcon(source: string): string {
  switch (source) {
    case 'PubMed': return '📚';
    case 'CrossRef': return '🔗';
    case 'Semantic Scholar': return '🤖';
    case 'Europe PMC': return '🇪🇺';
    case 'FDA': return '💊';
    case 'OpenAlex': return '🌐';
    case 'Cochrane Library': return '🏆';
    case 'Trip Database': return '🔍';
    case 'ClinicalTrials.gov': return '⚗️';
    case 'Clinical Guidelines': return '📋';
    default: return '📄';
  }
}

function calculateImpactScore(paper: any): number {
  let score = 5; // Base score
  
  // Evidence level bonus
  const evidenceWeight = getEvidenceLevelWeight(paper.evidenceLevel);
  if (evidenceWeight >= 90) score += 3; // Level 1A/1B
  else if (evidenceWeight >= 75) score += 2; // Level 2
  else if (evidenceWeight >= 50) score += 1; // Level 3A
  
  // Relevance bonus
  if (paper.relevanceScore >= 0.8) score += 1;
  else if (paper.relevanceScore >= 0.6) score += 0.5;
  
  // Journal impact (simplified)
  const highImpactJournals = [
    'new england journal of medicine', 'lancet', 'jama', 'nature', 'science',
    'bmj', 'annals of internal medicine', 'diabetes care', 'circulation',
    'cochrane database of systematic reviews'
  ];
  
  if (highImpactJournals.some(journal => 
    paper.journal.toLowerCase().includes(journal)
  )) {
    score += 1;
  }
  
  // Citation count bonus (if available)
  if (paper.citationCount && paper.citationCount > 100) score += 0.5;
  
  return Math.min(Math.round(score * 10) / 10, 10); // Cap at 10, round to 1 decimal
}

function getQualityRating(evidenceLevel: string): string {
  if (evidenceLevel.includes('Level 1A')) return '🟢 Excellent';
  if (evidenceLevel.includes('Level 1B')) return '🟢 Very High';
  if (evidenceLevel.includes('Level 2')) return '🔵 High';
  if (evidenceLevel.includes('Level 3A')) return '🟡 Moderate';
  if (evidenceLevel.includes('Level 3B')) return '🟡 Moderate';
  if (evidenceLevel.includes('Level 4')) return '🟠 Low-Moderate';
  if (evidenceLevel.includes('Level 5')) return '🔴 Limited';
  return '⚪ Unknown';
}

function getConfidenceColor(assessment: string): string {
  if (assessment.includes('Excellent') || assessment.includes('Very Good')) return '🟢';
  if (assessment.includes('Good')) return '🔵';
  if (assessment.includes('Moderate')) return '🟡';
  if (assessment.includes('Limited')) return '🟠';
  return '🔴';
}

function calculateEvidenceConfidence(papers: any[]): number {
  // Assess the quality of the evidence we found
  let confidence = 0;
  
  // Base confidence from evidence levels
  const level1Papers = papers.filter(p => p.evidenceLevel.includes('Level 1')).length;
  const level2Papers = papers.filter(p => p.evidenceLevel.includes('Level 2')).length;
  const level3Papers = papers.filter(p => p.evidenceLevel.includes('Level 3')).length;
  
  confidence += level1Papers * 30; // Meta-analyses/systematic reviews
  confidence += level2Papers * 20; // RCTs
  confidence += level3Papers * 10; // Cohort/case-control
  
  // Bonus for recent papers (2020+)
  const recentPapers = papers.filter(p => p.year >= 2020).length;
  confidence += recentPapers * 5;
  
  // Bonus for high relevance scores
  const avgRelevance = papers.reduce((sum, p) => sum + p.relevanceScore, 0) / papers.length;
  confidence += avgRelevance * 20;
  
  // Bonus for paper count (more papers = higher confidence)
  confidence += papers.length * 5;
  
  return Math.min(Math.round(confidence), 95); // Cap at 95%
}

function generateClinicalRecommendations(papers: any[], query: string): string {
  let recommendations = '';
  
  const hasMetaAnalysis = papers.some(p => p.studyType.includes('Meta-analysis'));
  const hasSystematicReview = papers.some(p => p.studyType.includes('Systematic Review'));
  const hasRCTs = papers.filter(p => p.studyType.includes('RCT')).length;
  const hasGuidelines = papers.filter(p => p.studyType.includes('Clinical Practice Guideline')).length;
  const evidenceConfidence = calculateEvidenceConfidence(papers);
  
  recommendations += `**📊 Evidence Confidence: ${evidenceConfidence}%** (based on study quality, relevance, and recency)\n\n`;
  
  if (hasMetaAnalysis) {
    recommendations += '🥇 **Gold Standard Evidence**: Meta-analyses provide the strongest foundation for clinical decisions\n';
  }
  if (hasSystematicReview) {
    recommendations += '⭐ **High-Quality Synthesis**: Systematic reviews offer comprehensive evidence evaluation\n';
  }
  if (hasRCTs >= 2) {
    recommendations += '🔬 **Strong Interventional Data**: Multiple RCTs support treatment effectiveness\n';
  }
  if (hasGuidelines > 0) {
    recommendations += '📋 **Clinical Guidelines Available**: Evidence-based practice recommendations identified\n';
  }
  
  recommendations += `📚 **Citation Density**: ${papers.length} relevant papers found\n`;
  recommendations += '🎯 **Clinical Integration**: Review findings alongside current practice guidelines\n';
  recommendations += '👥 **Patient Application**: Consider individual patient factors and preferences\n';
  
  // Query-specific recommendations with suggested clinical approach
  if (query.toLowerCase().includes('migraine')) {
    recommendations += '\n## 🎯 Recommended Migraine Treatment Approach\n\n';
    recommendations += '**First-line prophylactic agents:** Topiramate, propranolol, metoprolol, timolol\n\n';
    recommendations += '**Second-line:** Amitriptyline, venlafaxine, nadolol\n\n';
    recommendations += '**Acute treatment:** NSAIDs, triptans, combination analgesics\n\n';
    recommendations += '**Clinical strategies:** Start early during migraine onset, personalize based on patient profile and cost/accessibility\n';
  } else if (query.toLowerCase().includes('diabetes')) {
    recommendations += '\n**Diabetes-Specific Guidance**:\n';
    recommendations += '- Prioritize evidence-based first-line therapies (metformin)\n';
    recommendations += '- Consider newer agents (GLP-1 agonists, SGLT2 inhibitors) based on patient profile\n';
    recommendations += '- Integrate lifestyle interventions as foundation of care\n';
  }
  
  return recommendations;
}

function generateNoResultsResponse(query: string): string {
  return `# Research Analysis: ${query}

## 🔍 Search Results
No highly relevant papers found in our comprehensive search across 11 medical databases.

### 📊 Databases Searched:
- ✅ **PubMed** - Primary medical literature
- ✅ **Cochrane Library** - Systematic reviews  
- ✅ **Europe PMC** - European biomedical sources
- ✅ **Semantic Scholar** - AI-powered research discovery
- ✅ **OpenAlex** - Open access papers
- ✅ **CrossRef** - Academic paper resolution
- ✅ **ClinicalTrials.gov** - Clinical trial registry
- ✅ **Clinical Guidelines** - Practice guidelines
- ✅ **FDA Database** - Drug approval and safety data
- ✅ **Trip Database** - Evidence-based studies
- ✅ **NIH RePORTER** - Federal research funding

### 🤔 Possible Explanations:
1. **Very New/Emerging Topic**: Research may not be published yet
2. **Ultra-Specific Query**: Terms might be too narrow or technical
3. **Rare Condition/Treatment**: Limited research available globally
4. **Different Terminology**: Medical terms may vary by region/specialty

### 💡 Suggested Next Steps:

#### **Try Alternative Search Terms:**
- Use broader medical terminology
- Include synonyms and related conditions
- Try generic drug names vs. brand names
- Use MeSH terms (Medical Subject Headings)

#### **Expand Search Scope:**
- **Google Scholar** - For broader academic coverage
- **Specialized Medical Societies** - Disease-specific organizations
- **Medical Textbooks** - UpToDate, Medscape, etc.
- **Regional Databases** - EMBASE, LILACS for international coverage

#### **Recent Research Sources:**
- **BioRxiv/MedRxiv** - Preprint servers for latest research
- **Conference Proceedings** - Recent medical conferences
- **Clinical Trial Updates** - Active/recently completed studies

### 🏥 Clinical Context:
For immediate clinical guidance, consider:
- Consulting medical subspecialists
- Reviewing current practice guidelines
- Contacting pharmaceutical companies for drug-specific information
- Reaching out to patient advocacy groups for rare conditions

**Medical Disclaimer:** Always consult qualified healthcare professionals for current treatment information and clinical decisions. This search result indicates limited published research, not absence of treatment options.`;
}

// Helper function to fetch metadata from DOI for papers with missing information
async function fetchMetadataFromDOI(doi: string): Promise<any> {
  if (!doi) return null;
  
  try {
    // Use CrossRef API to resolve DOI metadata
    const response = await fetch(`https://api.crossref.org/works/${doi}`, {
      headers: {
        'User-Agent': 'MedGPT-Scholar/1.0 (mailto:research@medgpt.com)'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const work = data.message;
    
    return {
      title: work.title?.[0] || '',
      authors: work.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || [],
      journal: work['container-title']?.[0] || '',
      year: work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear(),
      abstract: work.abstract || ''
    };
  } catch (error) {
    console.error('DOI metadata fetch error:', error);
    return null;
  }
}

// Enhanced evidence prioritization function
function prioritizeByEvidenceHierarchy(papers: any[]): any[] {
  const evidencePriorityScore = (paper: any): number => {
    let score = 0;
    
    // Age penalty: Heavily penalize papers older than 5 years
    const currentYear = new Date().getFullYear();
    const ageInYears = currentYear - paper.year;
    if (ageInYears <= 2) score += 20; // Very recent
    else if (ageInYears <= 5) score += 10; // Recent
    else if (ageInYears <= 10) score -= 5; // Older
    else score -= 15; // Very old
    
    // Evidence level scoring
    const evidenceWeight = getEvidenceLevelWeight(paper.evidenceLevel);
    score += evidenceWeight / 5; // Scale down evidence weight
    
    // Study type bonus for high-quality designs
    if (paper.studyType.includes('Meta-analysis')) score += 30;
    else if (paper.studyType.includes('Systematic Review')) score += 25;
    else if (paper.studyType.includes('RCT') || paper.studyType.includes('Clinical Trial')) score += 20;
    else if (paper.studyType.includes('Clinical Practice Guideline')) score += 25;
    else if (paper.studyType.includes('Cohort')) score += 15;
    
    // Source quality bonus
    if (paper.source === 'Cochrane Library') score += 25;
    else if (paper.source === 'Clinical Guidelines') score += 20;
    else if (paper.source === 'Trip Database') score += 15;
    else if (paper.source === 'ClinicalTrials.gov') score += 15;
    else if (paper.source === 'PubMed') score += 10;
    
    // Citation count bonus (if available)
    if (paper.citationCount) {
      if (paper.citationCount > 1000) score += 10;
      else if (paper.citationCount > 500) score += 7;
      else if (paper.citationCount > 100) score += 5;
      else if (paper.citationCount > 50) score += 3;
    }
    
    // Relevance score bonus
    score += paper.relevanceScore * 10;
    
    return score;
  };
  
  return papers.sort((a, b) => evidencePriorityScore(b) - evidencePriorityScore(a));
}

// Function to filter for high-quality evidence only
function filterForHighQualityEvidence(papers: any[], strictMode: boolean = false): any[] {
  if (strictMode) {
    // Only Level 1-2 evidence (meta-analyses, systematic reviews, RCTs)
    return papers.filter(paper => {
      const evidenceWeight = getEvidenceLevelWeight(paper.evidenceLevel);
      return evidenceWeight >= 75 && // Level 2 or higher
             (paper.studyType.includes('Meta-analysis') || 
              paper.studyType.includes('Systematic Review') || 
              paper.studyType.includes('RCT') ||
              paper.studyType.includes('Clinical Practice Guideline'));
    });
  }
  
  // Standard filtering (Level 3A or higher)
  return papers.filter(paper => {
    const evidenceWeight = getEvidenceLevelWeight(paper.evidenceLevel);
    return evidenceWeight >= 50; // Level 3A or higher
  });
}