import { TestRunner } from './testUtils.ts';
import { runMoneyTests } from './money.test.ts';
import { runUaeValueObjectsTests } from './uaeValueObjects.test.ts';
import { runTaxPolicyTests } from './taxPolicy.test.ts';
import { runStateMachineTests } from './stateMachines.test.ts';
import { runEstimateAndApprovalTests } from './estimateAndApproval.test.ts';
import { runOwnershipAndAuthorizationTests } from './ownershipAndAuthorization.test.ts';
import { runInvoiceDerivationTests } from './invoiceDerivation.test.ts';
import { runFirestoreInfrastructureTests } from './firestoreInfrastructure.test.ts';
import { runApiBoundaryTests } from './apiBoundary.test.ts';
import { runStaffMasterDataTests } from './staffMasterData.test.ts';

export async function runAllTests(): Promise<{ passed: boolean; summary: string }> {
  console.log('====================================================');
  console.log('  STARTING ROCD STEP 2 & STEP 3 VERIFICATION SUITE');
  console.log('====================================================');

  const runner = new TestRunner();

  await runMoneyTests(runner);
  await runUaeValueObjectsTests(runner);
  await runTaxPolicyTests(runner);
  await runStateMachineTests(runner);
  await runEstimateAndApprovalTests(runner);
  await runOwnershipAndAuthorizationTests(runner);
  await runInvoiceDerivationTests(runner);
  await runFirestoreInfrastructureTests(runner);
  await runApiBoundaryTests(runner);
  await runStaffMasterDataTests(runner);

  const summary = runner.getSummary();
  console.log('====================================================');
  console.log(`  TEST RESULTS: ${summary.passed}/${summary.total} PASSED (${summary.failed} FAILED)`);
  console.log('====================================================');

  if (summary.failed > 0) {
    console.error('Failed tests:');
    for (const r of summary.results.filter((res) => !res.passed)) {
      console.error(` - [${r.suiteName}] ${r.name}: ${r.error}`);
    }
  }

  return {
    passed: summary.failed === 0,
    summary: `${summary.passed}/${summary.total} passed`,
  };
}

// If run directly via node / tsx:
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(({ passed }) => {
      if (!passed) process.exit(1);
    })
    .catch((err) => {
      console.error('Fatal error during test run:', err);
      process.exit(1);
    });
}
