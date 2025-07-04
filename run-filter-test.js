const { calculateRelevanceScore, checkBiomedicalRelevance, isBiomedicalPaper } = require('./test-filter-logic.js');

// Test with epidemiological paper
const epidemiologicalTitle = 'Global, regional, and national incidence, prevalence, and years lived with disability for 328 diseases and injuries for 195 countries, 1990–2016: a systematic analysis for the Global Burden of Disease Study 2016';
const epidemiologicalAbstract = 'Background The Global Burden of Disease Study 2016 (GBD 2016) provides a comprehensive assessment of prevalence, incidence, and years lived with disability (YLDs) for 328 diseases and injuries and 2982 sequelae for 195 countries and territories from 1990 to 2016.';
const treatmentQuery = 'What are the latest treatments for migraine prevention?';

console.log('=== TESTING EPIDEMIOLOGICAL PAPER ===');
console.log('Title:', epidemiologicalTitle.substring(0, 80) + '...');
console.log('Query:', treatmentQuery);
console.log('');

const relevanceScore = calculateRelevanceScore(epidemiologicalTitle, epidemiologicalAbstract, treatmentQuery);
console.log('Relevance Score:', relevanceScore);

const isBiomedical = checkBiomedicalRelevance(epidemiologicalTitle, epidemiologicalAbstract);
console.log('Is Biomedical:', isBiomedical);

const isBiomedicalPaperResult = isBiomedicalPaper(epidemiologicalTitle, epidemiologicalAbstract, treatmentQuery);
console.log('Is Biomedical Paper:', isBiomedicalPaperResult);

// Test treatment-focused paper for comparison
console.log('\n=== TESTING TREATMENT-FOCUSED PAPER ===');
const treatmentTitle = 'CGRP monoclonal antibodies for migraine prevention: a systematic review and meta-analysis';
const treatmentAbstract = 'Background: Calcitonin gene-related peptide (CGRP) monoclonal antibodies represent a novel therapeutic approach for migraine prevention. Methods: We conducted a systematic review and meta-analysis of randomized controlled trials evaluating the efficacy and safety of CGRP monoclonal antibodies (erenumab, fremanezumab, galcanezumab) for migraine prevention.';

console.log('Title:', treatmentTitle);
console.log('Query:', treatmentQuery);
console.log('');

const treatmentRelevanceScore = calculateRelevanceScore(treatmentTitle, treatmentAbstract, treatmentQuery);
console.log('Treatment paper relevance:', treatmentRelevanceScore);

const treatmentIsBiomedical = checkBiomedicalRelevance(treatmentTitle, treatmentAbstract);
console.log('Treatment Is Biomedical:', treatmentIsBiomedical);

const treatmentIsBiomedicalPaper = isBiomedicalPaper(treatmentTitle, treatmentAbstract, treatmentQuery);
console.log('Treatment Is Biomedical Paper:', treatmentIsBiomedicalPaper);

console.log('\n=== SUMMARY ===');
console.log('Epidemiological paper would be filtered out:', relevanceScore < 0.25);
console.log('Treatment paper would pass:', treatmentRelevanceScore >= 0.25);
