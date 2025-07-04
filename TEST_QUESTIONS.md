# Test Questions for All APIs Integration

## 🧪 **Test Suite for MedGPT Scholar Research System**

Use these questions to verify that all 6 APIs are working correctly and the quality filtering is properly implemented.

---

## 📋 **Basic Functionality Tests**

### 1. **General Medical Query**
**Question**: `What are the most effective treatments for migraine?`
**Expected Results**:
- 📊 Research Scope: 15-20 papers analyzed → 3 high-quality sources selected
- 📚 Multiple APIs contributing (PubMed, Europe PMC, CrossRef, etc.)
- 🏆 Evidence Level: Level 3A+ preferred
- 📝 Citations: 3-5 promising papers max

### 2. **Drug-Specific Query (Tests FDA Integration)**
**Question**: `What are the side effects of semaglutide for diabetes?`
**Expected Results**:
- 💊 FDA database should be included (drug-related query)
- 📡 Data Sources Used: Should show FDA among sources
- 🏥 Regulatory information included
- 🔍 Key Findings about drug safety and efficacy

### 3. **Condition Management Query**
**Question**: `best practices for managing chronic kidney disease`
**Expected Results**:
- 🎯 Clinical implications section
- 📊 Evidence quality assessment table
- 🇪🇺 Europe PMC likely contributing
- 🤖 Semantic Scholar AI insights possible

---

## 🔬 **Advanced Testing**

### 4. **Emerging Treatment Query**
**Question**: `CAR-T cell therapy effectiveness in leukemia`
**Expected Results**:
- 🌐 OpenAlex should contribute (cutting-edge research)
- 🔗 CrossRef linking scholarly works
- 📚 PubMed clinical trials
- 🏆 High evidence levels (systematic reviews, RCTs)

### 5. **European Research Focus**
**Question**: `European guidelines for COVID-19 treatment`
**Expected Results**:
- 🇪🇺 Europe PMC should be primary contributor
- 📊 Geographic diversity in sources
- 🏥 Regional perspectives included
- 📡 Clear source attribution

### 6. **AI-Enhanced Research Query**
**Question**: `machine learning applications in radiology diagnosis`
**Expected Results**:
- 🤖 Semantic Scholar should contribute heavily
- 🧠 AI insights and influence metrics
- 🔍 Interdisciplinary research
- 📊 Innovation-focused papers

---

## 🛡️ **Quality Filtering Tests**

### 7. **Non-Medical Query (Should Filter Out)**
**Question**: `density functional theory calculations`
**Expected Results**:
- ❌ Should return "No highly relevant papers found"
- 🔍 Non-medical exclusion working
- 📋 Recommendations for alternative searches
- 🚫 Computational chemistry filtered out

### 8. **Overly Broad Query**
**Question**: `health`
**Expected Results**:
- 🎯 Should find focused, relevant papers despite broad query
- 📊 Quality filtering working (40%+ relevance)
- 🏆 Evidence Level: Level 3A+ only
- 📝 Limited to most promising results

### 9. **Very Specific Medical Query**
**Question**: `CRISPR gene editing for sickle cell disease clinical trials`
**Expected Results**:
- 🔬 High-quality, specific research
- 📚 PubMed clinical trials
- 🌐 OpenAlex cutting-edge research
- 🏆 High evidence levels and impact scores

---

## 📊 **Source Distribution Tests**

### 10. **Pharmaceutical Research**
**Question**: `new antibiotics for resistant infections`
**Expected Results**:
- 📚 PubMed: Clinical research
- 💊 FDA: Drug approvals/safety
- 🇪🇺 Europe PMC: European studies
- 🤖 Semantic Scholar: AI analysis
- 🌐 OpenAlex: Open access research
- 🔗 CrossRef: Scholarly linking

---

## ✅ **Success Criteria for Each Test**

### **What to Look For:**
1. **📊 Research Scope**: "X papers analyzed → 3 high-quality sources selected"
2. **📡 Data Sources Used**: Section showing which APIs contributed
3. **🏆 Evidence Levels**: Level 3A+ prioritized (systematic reviews, RCTs, cohort studies)
4. **📝 Citation Count**: Maximum 5 citations (not overwhelming)
5. **🎯 Clinical Implications**: Actionable insights for each paper
6. **🔍 Key Findings**: AI-paraphrased summaries
7. **📊 Impact Scores**: 6-10 range for quality papers
8. **🌐 Source Icons**: Visual indicators for each database

### **Error Conditions to Test:**
- **API Failures**: Should gracefully continue with available APIs
- **No Results**: Should provide helpful alternative suggestions
- **Non-Medical Queries**: Should filter out appropriately

---

## 🚀 **Quick Test Commands**

You can run these in your browser or test interface:

```
1. "migraine treatments"
2. "semaglutide side effects" 
3. "chronic kidney disease management"
4. "CAR-T cell therapy leukemia"
5. "European COVID-19 guidelines"
6. "machine learning radiology"
7. "density functional theory" (should filter out)
8. "health" (very broad)
9. "CRISPR sickle cell trials"
10. "new antibiotics resistant infections"
```

---

## 📈 **Performance Benchmarks**

### **Expected Metrics:**
- **Response Time**: < 10 seconds for all APIs
- **Papers Analyzed**: 15-20 papers
- **Quality Selection**: 3 high-quality papers
- **Citations**: 3-5 promising papers
- **API Coverage**: All 6 APIs attempted
- **Success Rate**: 5-6 APIs typically successful

### **Quality Indicators:**
- **Relevance**: 40%+ for selected papers
- **Evidence Level**: Level 3A+ preferred
- **Impact Score**: 6-10 range
- **Source Diversity**: Multiple APIs contributing
- **Deduplication**: No duplicate papers shown

---

## 🏆 **Final Validation**

**✅ System is working correctly if:**
- All test queries return relevant, high-quality medical research
- Multiple APIs contribute to most queries
- Quality filtering prevents overwhelming results
- Source transparency shows database attribution
- Evidence levels are properly prioritized
- Clinical implications are actionable and meaningful

**❌ Issues to investigate if:**
- Only 1-2 APIs contributing consistently
- Too many or too few papers returned
- Non-medical papers appearing in results
- Missing source attribution
- Poor relevance scores
- No evidence level prioritization
