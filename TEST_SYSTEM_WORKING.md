# System Working Test - MedGPT Scholar

## 🧪 Quick System Test

This test verifies that all 6 research APIs are working and the system is functioning correctly.

---

## 🚀 Method 1: Quick API Test via Browser

### Step 1: Start the Development Server
```bash
npm run dev
```

### Step 2: Open Browser and Test
Open your browser and go to: `http://localhost:3000`

### Step 3: Test Questions (Use these exact questions)

#### Test 1: Diabetes Research
**Question**: "What are the latest treatments for type 2 diabetes?"

**Expected Results**:
- Should find papers from PubMed, CrossRef, Europe PMC
- Should show 3-5 high-quality citations
- Should include evidence levels (Level 1A, 2A, etc.)
- Should show source attribution (📚 PubMed, 🔗 CrossRef, etc.)

#### Test 2: Hypertension Management
**Question**: "blood pressure management in elderly patients"

**Expected Results**:
- Should find cardiovascular research papers
- Should show clinical trials or systematic reviews
- Should deduplicate any duplicate papers
- Should rank by evidence quality

#### Test 3: Cancer Immunotherapy
**Question**: "immunotherapy effectiveness in lung cancer"

**Expected Results**:
- Should find oncology papers
- Should include high-impact journals
- Should show relevance scores
- Should filter out non-medical papers

---

## 🔧 Method 2: Direct API Test via Terminal

### Test the Research API Directly

```powershell
# Test 1: Simple diabetes query
curl -X POST http://localhost:3000/api/research -H "Content-Type: application/json" -d "{\"query\": \"type 2 diabetes treatment\"}"

# Test 2: Hypertension query
curl -X POST http://localhost:3000/api/research -H "Content-Type: application/json" -d "{\"query\": \"hypertension elderly management\"}"

# Test 3: Cancer immunotherapy query
curl -X POST http://localhost:3000/api/research -H "Content-Type: application/json" -d "{\"query\": \"lung cancer immunotherapy\"}"
```

---

## ✅ Success Indicators

### What You Should See:

1. **Multiple API Sources**:
   ```
   📡 Data Sources Used:
   - 📚 PubMed: 2 papers
   - 🇪🇺 Europe PMC: 1 paper  
   - 🤖 Semantic Scholar: 1 paper
   - 🔗 CrossRef: 1 paper
   ```

2. **Quality Citations** (3-5 papers max):
   ```
   > 🏆 Evidence Level: Level 1A | Study Type: Meta-analysis
   > 📊 Impact Score: 8.5/10 | Relevance: 92%
   > 📰 Source: The Lancet (2023) | Database: PubMed
   ```

3. **Research Scope Summary**:
   ```
   📊 Research Scope: 16 papers analyzed → 3 high-quality sources selected
   ```

4. **No Information Overload**: Maximum 5 citations shown

---

## 🚨 Troubleshooting

### If No Results:
1. Check that development server is running on port 3000
2. Verify API keys are set in environment variables
3. Check browser console for errors
4. Try a simpler query like "diabetes"

### If Too Many Results:
- The system should automatically limit to 5 citations maximum
- If showing more, there may be a filtering issue

### If No Source Attribution:
- Each paper should show which API provided it
- Missing attribution indicates a display issue

---

## 🎯 Expected Performance

- **Response Time**: 3-8 seconds for research queries
- **Citation Count**: 3-5 high-quality papers
- **Source Diversity**: 2-4 different APIs contributing
- **Quality Focus**: Level 3A+ evidence prioritized
- **No Duplicates**: Deduplication should work perfectly

---

## 📊 Test Results Template

### Test Results Log:
```
Date: ____________
Query: "type 2 diabetes treatment"

✅/❌ APIs Working: ___/6 APIs responded
✅/❌ Citations Found: ___ papers shown (should be 3-5)
✅/❌ Source Attribution: Sources properly labeled
✅/❌ Evidence Levels: Evidence grading shown
✅/❌ Deduplication: No duplicate papers
✅/❌ Response Time: Under 10 seconds
✅/❌ Mobile Friendly: Works on mobile device

Overall Status: ✅ PASS / ❌ FAIL
Notes: ________________________________
```

---

## 🔍 Advanced Verification

### Check Individual API Status:
1. **PubMed**: Should be primary source for medical papers
2. **CrossRef**: Should provide DOI links and metadata
3. **Europe PMC**: Should add European perspective
4. **Semantic Scholar**: Should include AI influence metrics
5. **FDA**: Should appear for drug-related queries
6. **OpenAlex**: Should provide open access papers

### Verify Deduplication:
- Search for a well-known study (e.g., "DASH diet hypertension")
- Same paper should not appear multiple times
- Best source version should be kept

---

## 🏆 Success Criteria

### System is Working Correctly If:
1. ✅ All medical queries return relevant results
2. ✅ Maximum 5 citations shown (no information overload)
3. ✅ Multiple APIs contributing to results
4. ✅ Evidence levels and source attribution visible
5. ✅ Response time under 10 seconds
6. ✅ No duplicate papers in results
7. ✅ Biomedical filtering working (no physics/chemistry papers)
8. ✅ Mobile interface responsive and usable

### Red Flags (System Needs Attention):
- ❌ No results for medical queries
- ❌ More than 5 citations shown
- ❌ Only 1 API source working
- ❌ Duplicate papers in results
- ❌ Non-medical papers in medical queries
- ❌ No evidence levels or source attribution
- ❌ Response time over 15 seconds

---

## 📞 Quick Status Check

**Run this single command to verify everything:**

```powershell
curl -X POST http://localhost:3000/api/research -H "Content-Type: application/json" -d "{\"query\": \"diabetes\"}" | findstr "papers analyzed"
```

**Expected Output**: Something like "16 papers analyzed → 3 high-quality sources selected"

If you see this output, the system is working correctly! 🎉
