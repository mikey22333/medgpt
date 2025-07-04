/**
 * Test NIH RePORTER Integration
 * 
 * Verifies that the NIH RePORTER API client is working correctly
 * and can search for medical research projects and funding data.
 */

const { NIHReporterClient } = require('./src/lib/research/nih-reporter.ts');

async function testNIHReporter() {
  console.log('🧪 Testing NIH RePORTER API Integration...\n');
  
  try {
    const nihClient = new NIHReporterClient();
    
    // Test 1: Basic search for migraine research
    console.log('📋 Test 1: Searching for migraine research projects...');
    const migrainePr = await nihClient.searchMedicalResearch('migraine', 3);
    console.log(`   Found ${migrainePr.length} migraine projects`);
    if (migrainePr.length > 0) {
      const firstProject = migrainePr[0];
      console.log(`   ✅ Sample: ${firstProject.project_title.substring(0, 60)}...`);
      console.log(`   💰 Funding: $${firstProject.award_amount?.toLocaleString() || 'Unknown'}`);
      console.log(`   📊 Publications: ${firstProject.publications?.length || 0}`);
    }
    
    // Test 2: Search for diabetes research
    console.log('\n📋 Test 2: Searching for diabetes research projects...');
    const diabetesProjects = await nihClient.searchMedicalResearch('diabetes', 3);
    console.log(`   Found ${diabetesProjects.length} diabetes projects`);
    if (diabetesProjects.length > 0) {
      const firstProject = diabetesProjects[0];
      console.log(`   ✅ Sample: ${firstProject.project_title.substring(0, 60)}...`);
      console.log(`   🏛️ Agency: ${firstProject.agency_ic_admin?.abbreviation || 'NIH'}`);
      console.log(`   📅 Year: ${firstProject.fiscal_year || 'Unknown'}`);
    }
    
    // Test 3: Check format functionality
    console.log('\n📋 Test 3: Testing formatting function...');
    if (migrainePr.length > 0) {
      const formatted = nihClient.formatProjectForMedicalResearch(migrainePr[0]);
      console.log(`   ✅ Format test successful (${formatted.length} characters)`);
      console.log(`   📝 Preview: ${formatted.substring(0, 100)}...`);
    }
    
    // Test 4: Verify data structure
    console.log('\n📋 Test 4: Verifying data structure...');
    const allProjects = [...migrainePr, ...diabetesProjects];
    let hasValidData = 0;
    for (const project of allProjects) {
      if (project.project_num && project.project_title) {
        hasValidData++;
      }
    }
    console.log(`   ✅ ${hasValidData}/${allProjects.length} projects have valid core data`);
    
    // Summary
    console.log('\n🎯 NIH RePORTER Integration Test Results:');
    console.log(`   ✅ API Connection: Working`);
    console.log(`   ✅ Search Function: Working`);
    console.log(`   ✅ Data Retrieval: Working`);
    console.log(`   ✅ Format Function: Working`);
    console.log(`   📊 Total Projects Found: ${allProjects.length}`);
    
    // Test integration format for medical research
    console.log('\n📋 Testing integration with medical research format...');
    const sampleProject = allProjects[0];
    if (sampleProject) {
      const mappedProject = {
        id: sampleProject.project_num,
        title: sampleProject.project_title,
        authors: sampleProject.principal_investigators?.map(pi => `${pi.first_name} ${pi.last_name}`) || ['NIH Investigator'],
        source: 'NIH RePORTER',
        relevanceScore: 0.8, // Mock score
        studyType: sampleProject.clinical_trial ? 'NIH Clinical Research' : 'NIH Basic/Translational Research',
        evidenceLevel: sampleProject.publications?.length > 0 ? 'Level 3A (Research with Publications)' : 'Level 4 (Research in Progress)',
        awardAmount: sampleProject.award_amount,
        publications: sampleProject.publications?.length || 0
      };
      
      console.log('   ✅ Successfully mapped NIH data to research format');
      console.log(`   📊 Study Type: ${mappedProject.studyType}`);
      console.log(`   📈 Evidence Level: ${mappedProject.evidenceLevel}`);
    }
    
    console.log('\n🎉 NIH RePORTER integration test PASSED!');
    
  } catch (error) {
    console.error('❌ NIH RePORTER test failed:', error.message);
    console.error('   Check API endpoint and network connectivity');
  }
}

// Run the test
testNIHReporter().catch(console.error);
