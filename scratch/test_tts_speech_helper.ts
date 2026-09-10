import { splitTextIntoSpeechChunks } from '../src/utils/speechHelper';

function runSpeechHelperTests() {
  console.log('====================================================');
  console.log('🧪 TESTING SPEECH CHUNKING AND TTS UTILITY');
  console.log('====================================================\n');

  const testCases = [
    {
      name: 'Single sentence question',
      input: 'Can you describe your experience with React and TypeScript in production systems?',
      expectedNonEmpty: true,
    },
    {
      name: 'Multi-sentence 3-part interview question (Typical bug scenario)',
      input: 'Can you walk me through a challenging technical problem you solved recently? Please explain the architecture, the specific trade-offs you considered, and how you measured the final impact of your solution. What would you do differently if you had to do it again?',
      expectedNonEmpty: true,
    },
    {
      name: 'Long 4-sentence scenario question with punctuation',
      input: 'Tell me about a time when a critical production incident occurred under high load. How did you identify the root cause, coordinate with your team during the outage, and communicate status updates to stakeholders? What preventative measures or observability improvements did you implement afterwards to ensure it never happened again?',
      expectedNonEmpty: true,
    },
    {
      name: 'Question with exclamation and multiple question marks',
      input: 'Welcome to your technical assessment! Could you explain what ACID compliance means in relational databases? How does MongoDB handle transactions in comparison?',
      expectedNonEmpty: true,
    },
    {
      name: 'Extremely long single sentence clause',
      input: 'Please explain how you would design a globally distributed real-time collaborative document editing system that supports tens of thousands of concurrent users with offline sync capabilities, optimistic UI updates, conflict-free replicated data types, automated failovers across multiple AWS cloud regions, and end-to-end latency below fifty milliseconds.',
      expectedNonEmpty: true,
    },
  ];

  let passed = 0;

  testCases.forEach((tc, idx) => {
    console.log(`Test Case ${idx + 1}: ${tc.name}`);
    console.log(`Original Text: "${tc.input}"`);

    const chunks = splitTextIntoSpeechChunks(tc.input, 160);
    console.log(`Generated ${chunks.length} Chunk(s):`);
    chunks.forEach((chunk, cIdx) => {
      console.log(`  [Chunk ${cIdx + 1} (${chunk.length} chars)]: "${chunk}"`);
    });

    // Verify all chunks are non-empty
    const allNonEmpty = chunks.every((c) => c.trim().length > 0);
    if (!allNonEmpty) {
      throw new Error(`Test failed: empty chunk found in test case ${idx + 1}`);
    }

    // Verify all words from original text exist across chunks (no text dropped)
    const originalWords = tc.input.replace(/[^a-zA-Z0-9]/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);
    const chunkWords = chunks.join(' ').replace(/[^a-zA-Z0-9]/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);

    if (originalWords.length !== chunkWords.length) {
      console.error(`Mismatch in word count! Original: ${originalWords.length}, Chunks: ${chunkWords.length}`);
      console.error('Original words:', originalWords);
      console.error('Chunk words:', chunkWords);
      throw new Error(`Word count mismatch in test case ${idx + 1}`);
    }

    for (let i = 0; i < originalWords.length; i++) {
      if (originalWords[i] !== chunkWords[i]) {
        throw new Error(`Word mismatch at index ${i}: expected "${originalWords[i]}", got "${chunkWords[i]}"`);
      }
    }

    console.log(`✅ Test Case ${idx + 1} PASSED: 100% text preserved across ${chunks.length} chunks.\n`);
    passed++;
  });

  console.log(`====================================================`);
  console.log(`🎉 ALL ${passed}/${testCases.length} SPEECH HELPER TESTS PASSED!`);
  console.log(`====================================================`);
}

runSpeechHelperTests();
