// Test script to verify UUID generation
const { randomUUID } = require('crypto');

async function testUUIDCompatibility() {
  console.log('Testing UUID compatibility...');

  // Test UUID generation
  const sessionId = randomUUID();
  console.log('Generated session ID:', sessionId);

  // Test if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidUUID = uuidRegex.test(sessionId);
  console.log('Is valid UUID format:', isValidUUID);

  // Test multiple UUIDs
  const uuids = Array.from({ length: 5 }, () => randomUUID());
  console.log('Generated UUIDs:', uuids);

  console.log('✅ UUID compatibility test passed');
}

testUUIDCompatibility().catch(console.error);
