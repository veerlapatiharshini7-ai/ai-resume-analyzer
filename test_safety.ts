import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Reference to the actual sanitizeError logic from server.ts
function sanitizeError(err: unknown): Record<string, unknown> | string {
  const rawKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '') || '';
  const redact = (str: string): string => {
    if (!str) return str;
    if (rawKey && rawKey.length > 5) {
      return str.split(rawKey).join('[REDACTED_GEMINI_KEY]');
    }
    return str;
  };

  if (!err) return 'Unknown error';

  if (typeof err === 'object' && err !== null) {
    const anyErr = err as any;
    const sanitizedObj: Record<string, unknown> = {
      name: redact(String(anyErr.name || 'Error')),
      message: redact(String(anyErr.message || '')),
      status: anyErr.status || anyErr.statusCode || anyErr.code || undefined,
    };
    if (anyErr.errorDetails) {
      try {
        sanitizedObj.errorDetails = JSON.parse(redact(JSON.stringify(anyErr.errorDetails)));
      } catch {
        sanitizedObj.errorDetails = redact(String(anyErr.errorDetails));
      }
    }
    if (anyErr.stack) {
      sanitizedObj.stack = redact(String(anyErr.stack));
    }
    return sanitizedObj;
  }

  return redact(String(err));
}

// Reference to the actual getGeminiModel logic from server.ts
function getGeminiModel(customModel?: string): string {
  const model = (customModel !== undefined ? customModel : process.env.GEMINI_MODEL)?.trim().replace(/^["']|["']$/g, '');
  if (!model || model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash') {
    return 'gemini-3.6-flash';
  }
  return model;
}

async function runSafetyTests() {
  console.log('====================================================');
  console.log('       AI Resume Analyzer - Safety Verification     ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      if (detail) console.log(`       Detail: ${detail}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  const rawKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '') || '';

  // ----------------------------------------------------
  // Test 1: API Key Redaction in Error Messages
  // ----------------------------------------------------
  console.log('--- Suite 1: Error Sanitization & Credential Safety ---');
  const errorWithMessage = new Error(`Request failed with API key: ${rawKey} at endpoint`);
  const sanitizedMsg = sanitizeError(errorWithMessage);
  const msgText = typeof sanitizedMsg === 'object' ? JSON.stringify(sanitizedMsg) : sanitizedMsg;

  assert(
    !msgText.includes(rawKey) && msgText.includes('[REDACTED_GEMINI_KEY]'),
    'Error message redaction',
    'Raw GEMINI_API_KEY was stripped and replaced with [REDACTED_GEMINI_KEY]'
  );

  // ----------------------------------------------------
  // Test 2: API Key Redaction in Stack Traces & Details
  // ----------------------------------------------------
  const errorWithDetails = {
    name: 'GoogleGenAIError',
    message: 'Permission denied',
    status: 403,
    errorDetails: {
      url: `https://generativelanguage.googleapis.com/v1beta/models?key=${rawKey}`,
      reason: 'BAD_KEY',
    },
    stack: `Error at GoogleGenAI.call (key=${rawKey})\n    at server.ts:590:10`,
  };
  const sanitizedDetails = sanitizeError(errorWithDetails);
  const detailsText = JSON.stringify(sanitizedDetails);

  assert(
    !detailsText.includes(rawKey) &&
      detailsText.includes('[REDACTED_GEMINI_KEY]') &&
      (sanitizedDetails as any).status === 403,
    'Nested error details & stack trace redaction',
    'Preserved status code and structure while redacting API key from URL and stack'
  );

  // ----------------------------------------------------
  // Test 3: Deprecated/Retired Model Interception
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Model Resolution Safety ---');
  const retiredModelTest1 = getGeminiModel('gemini-2.5-flash');
  const retiredModelTest2 = getGeminiModel('gemini-1.5-flash');
  const emptyModelTest = getGeminiModel('');
  const validModelTest = getGeminiModel('gemini-3.6-flash');

  assert(
    retiredModelTest1 === 'gemini-3.6-flash' &&
      retiredModelTest2 === 'gemini-3.6-flash' &&
      emptyModelTest === 'gemini-3.6-flash' &&
      validModelTest === 'gemini-3.6-flash',
    'Model deprecation safeguard',
    'Deprecated models (2.5-flash, 1.5-flash, empty) resolve to gemini-3.6-flash'
  );

  // ----------------------------------------------------
  // Test 4: Live Server Health & Config Safety
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Live Server Safety & API Flow ---');
  try {
    const healthRes = await fetch('http://localhost:3000/api/health');
    const healthData = await healthRes.json();
    const healthStr = JSON.stringify(healthData);

    assert(
      healthRes.status === 200 &&
        healthData.hasApiKey === true &&
        healthData.model === 'gemini-3.6-flash' &&
        !healthStr.includes(rawKey),
      'Live /api/health safety check',
      `Backend healthy, hasApiKey=true, model=gemini-3.6-flash, credentials unexposed`
    );
  } catch (err: any) {
    assert(false, 'Live /api/health safety check', `Failed to connect to backend: ${err.message}`);
  }

  // ----------------------------------------------------
  // Test 5: Live Cover Letter API Generation & Response Safety
  // ----------------------------------------------------
  try {
    const testPayload = {
      resumeText: `Alex Mercer (Safety Verification)\nSenior Infrastructure Engineer with 6 years experience in Kubernetes, Terraform, AWS, and TypeScript.\nLed cloud migration achieving 99.99% availability and reduced latency by 35%.\nExperience:\nStaff DevOps Specialist at CloudSphere Tech (2021-Present)\nSystems Architect at NetScale Inc (2018-2021)`,
      targetRole: 'Staff Site Reliability Engineer',
      companyName: 'CloudScale Enterprises',
      jobDescription: 'Seeking a Staff SRE to manage highly scalable multi-cloud infrastructure and lead automation initiatives.',
      tone: 'Confident',
    };

    console.log('Sending live cover letter request to verify safety & generation flow...');
    const startTime = Date.now();
    const clRes = await fetch('http://localhost:3000/api/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    const duration = Date.now() - startTime;
    const clData = await clRes.json();
    const clStr = JSON.stringify(clData);

    assert(
      clRes.status === 200 &&
        clData.usedFallback === false &&
        typeof clData.coverLetter === 'string' &&
        clData.coverLetter.length > 100 &&
        !clStr.includes(rawKey),
      'Live Cover Letter AI generation & safety',
      `Completed in ${duration}ms, usedFallback=false, letterLength=${clData.coverLetter?.length || 0} chars, zero credential leakage`
    );

    if (clData.coverLetter) {
      console.log('\n--- Generated Letter Preview ---');
      console.log(clData.coverLetter.slice(0, 220) + '...\n');
    }
  } catch (err: any) {
    assert(false, 'Live Cover Letter AI generation & safety', `Request failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('====================================================');
  console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('ALL SAFETY TESTS PASSED SUCCESSFULLY.\n');
    process.exit(0);
  } else {
    console.error('SOME SAFETY TESTS FAILED.\n');
    process.exit(1);
  }
}

runSafetyTests().catch((e) => {
  console.error('Fatal safety test runner error:', e);
  process.exit(1);
});
