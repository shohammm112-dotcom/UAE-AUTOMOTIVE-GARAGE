import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import {
  ORDERED_JOB_STAGES,
  JobStateMachine,
  type JobStage,
} from '../domain/stateMachines/JobStateMachine.ts';
import { assert, assertEquals, TestRunner } from './testUtils.ts';

const SRC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const readSource = (relativePath: string): string =>
  readFileSync(resolve(SRC_ROOT, relativePath), 'utf8');

/**
 * The authoritative lifecycle, in order. Intentionally duplicated here as a
 * golden copy so a silent reorder or extension of ORDERED_JOB_STAGES fails.
 */
const AUTHORITATIVE_STAGES: JobStage[] = [
  'intake_checkin',
  'inspection_in_progress',
  'estimate_pending',
  'repair_in_progress',
  'quality_control',
  'ready_for_delivery',
  'delivered',
];

const STAGE_SET = new Set<string>(AUTHORITATIVE_STAGES);

/** The module that is allowed to declare the lifecycle. Everything else consumes it. */
const AUTHORITATIVE_MODULE = 'domain/stateMachines/JobStateMachine.ts';

/**
 * Every module that may plausibly render or reason about a job stage.
 * This is a DIRECTORY WALK, not an allowlist: a page added tomorrow is scanned
 * automatically. An allowlist would silently stop covering new code.
 */
function walkSources(...roots: string[]): string[] {
  const found: string[] = [];
  const visit = (absDir: string): void => {
    for (const entry of readdirSync(absDir, { withFileTypes: true })) {
      const abs = join(absDir, entry.name);
      if (entry.isDirectory()) visit(abs);
      else if (/\.tsx?$/.test(entry.name)) found.push(relative(SRC_ROOT, abs));
    }
  };
  for (const root of roots) {
    const abs = resolve(SRC_ROOT, root);
    if (existsSync(abs)) visit(abs);
  }
  return found.sort();
}

/** Array literals of short quoted strings, e.g. ["a", "b", "c"] — including multi-line. */
function arrayLiteralsIn(source: string): string[] {
  return source.match(/\[[^[\]]*\]/g) ?? [];
}

/** Quoted string literals inside a fragment of source. */
function quotedStringsIn(fragment: string): string[] {
  return (fragment.match(/['"]([a-z0-9_]+)['"]/g) ?? []).map((s) => s.slice(1, -1));
}

export async function runJobLifecycleConsistencyTests(runner: TestRunner): Promise<void> {
  runner.suite('Job Lifecycle Consistency (staff + customer portals)', () => {});

  await runner.test(
    'ORDERED_JOB_STAGES matches the authoritative lifecycle exactly and in order',
    () => {
      assertEquals(
        ORDERED_JOB_STAGES.join(','),
        AUTHORITATIVE_STAGES.join(','),
        'ORDERED_JOB_STAGES has drifted from the authoritative job lifecycle'
      );
    }
  );

  await runner.test(
    'an UNKNOWN stage degrades predictably: index -1 and no legal transitions',
    () => {
      // This is the real-world failure mode: a legacy/garbage stage arriving from
      // persistence. The API types it as JobStage but nothing validates it at the
      // I/O boundary, so the UI must be understood to receive it.
      for (const bogus of ['qc_testing', 'received', 'cancelled', '', 'DELIVERED']) {
        assertEquals(
          JobStateMachine.getStageIndex(bogus as JobStage),
          -1,
          `Unknown stage "${bogus}" must not resolve to a real timeline index`
        );
        assertEquals(
          JobStateMachine.getLegalNextStages(bogus as JobStage).length,
          0,
          `Unknown stage "${bogus}" must offer no transitions (fail closed)`
        );
        assert(
          !JobStateMachine.canTransition(bogus as JobStage, 'delivered'),
          `Unknown stage "${bogus}" must not be able to transition anywhere`
        );
      }
    }
  );

  await runner.test(
    'customer timeline reveals post-inspection state from estimate_pending onward',
    () => {
      const estimateIndex = JobStateMachine.getStageIndex('estimate_pending');
      const expected: Record<JobStage, boolean> = {
        intake_checkin: false,
        inspection_in_progress: false,
        estimate_pending: true,
        repair_in_progress: true,
        quality_control: true,
        ready_for_delivery: true,
        delivered: true,
      };

      for (const stage of AUTHORITATIVE_STAGES) {
        assertEquals(
          JobStateMachine.getStageIndex(stage) >= estimateIndex,
          expected[stage],
          `Post-inspection boundary wrong at stage "${stage}"`
        );
      }
    }
  );

  await runner.test('every authoritative stage is reachable from intake_checkin', () => {
    const reached = new Set<JobStage>(['intake_checkin']);
    const queue: JobStage[] = ['intake_checkin'];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const next of JobStateMachine.getLegalNextStages(current)) {
        if (!reached.has(next)) {
          reached.add(next);
          queue.push(next);
        }
      }
    }

    for (const stage of AUTHORITATIVE_STAGES) {
      assert(
        reached.has(stage),
        `Stage "${stage}" is unreachable from intake_checkin; the timeline advertises a stage no job can enter`
      );
    }
  });

  await runner.test(
    'getLegalNextStages hands out a fresh copy each call (no shared mutable state)',
    () => {
      const a = JobStateMachine.getLegalNextStages('quality_control');
      const b = JobStateMachine.getLegalNextStages('quality_control');
      assert(a !== b, 'getLegalNextStages returned the same array reference twice');
      assertEquals(a.join(','), b.join(','), 'two reads disagreed');

      // Mutate only the local copy; never risk corrupting the shared table for
      // later suites even if the defensive copy were to regress.
      a.push('delivered');
      assertEquals(
        JobStateMachine.getLegalNextStages('quality_control').join(','),
        b.join(','),
        'mutating a returned array leaked into LEGAL_TRANSITIONS'
      );
      assert(
        !JobStateMachine.canTransition('quality_control', 'delivered'),
        'quality_control -> delivered must remain illegal'
      );
    }
  );

  await runner.test(
    'no module outside the domain redeclares the lifecycle as an array literal',
    () => {
      // Name-agnostic on purpose: renaming STAGES to TIMELINE_STEPS must not
      // evade this. We look for any array literal holding 2+ real stage values.
      for (const modulePath of walkSources('app', 'types', 'application/dto', 'components', 'lib')) {
        if (modulePath.endsWith(AUTHORITATIVE_MODULE)) continue;
        const source = readSource(modulePath);

        for (const literal of arrayLiteralsIn(source)) {
          const stageMembers = quotedStringsIn(literal).filter((v) => STAGE_SET.has(v));
          assert(
            stageMembers.length < 2,
            `${modulePath} declares its own lifecycle array (${stageMembers.join(', ')}). ` +
              `Import ORDERED_JOB_STAGES from ${AUTHORITATIVE_MODULE} instead.`
          );
        }
      }
    }
  );

  await runner.test(
    'no module compares .stage against a value that is not a real JobStage',
    () => {
      // Catches invented vocabulary such as `job.stage === 'cancelled'`.
      const comparison = /\.stage\s*(?:===|!==)\s*['"]([A-Za-z0-9_]+)['"]/g;

      for (const modulePath of walkSources('app', 'types', 'application', 'components', 'lib')) {
        const source = readSource(modulePath);
        for (const match of source.matchAll(comparison)) {
          const literal = match[1];
          assert(
            STAGE_SET.has(literal),
            `${modulePath} compares .stage against "${literal}", which is not a JobStage. ` +
              `Valid values: ${AUTHORITATIVE_STAGES.join(', ')}`
          );
        }
      }
    }
  );

  await runner.test(
    'the lifecycle module stays browser-safe (no node/server imports in its closure)',
    () => {
      // The UI imports this module directly. If anything in its transitive
      // closure ever pulls a Node builtin or a third-party server package, the
      // production bundle breaks. Nothing else in the repo enforces this.
      const seen = new Set<string>();
      const queue = [AUTHORITATIVE_MODULE];

      while (queue.length > 0) {
        const modulePath = queue.shift()!;
        if (seen.has(modulePath)) continue;
        seen.add(modulePath);

        const source = readSource(modulePath);
        const specifiers = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

        for (const spec of specifiers) {
          assert(
            spec.startsWith('.'),
            `${modulePath} imports non-relative "${spec}"; the lifecycle module's closure must stay dependency-free for the browser bundle`
          );
          const resolved = relative(
            SRC_ROOT,
            resolve(dirname(resolve(SRC_ROOT, modulePath)), spec)
          );
          queue.push(resolved);
        }
      }

      assert(seen.size >= 2, 'expected to walk at least the state machine and its error module');
    }
  );

  await runner.test(
    'the live wire DTO types stage as JobStage, not a bare string',
    () => {
      // AppDtos is what *ApplicationService.toDto() returns and what the staff
      // pages import, so this is the contract that actually matters. Typing it
      // is what makes `tsc` reject a fictional stage comparison.
      const source = readSource('application/dto/AppDtos.ts');
      assert(
        /readonly stage:\s*JobStage;/.test(source),
        'AppDtos.JobResponseDto.stage must be typed as JobStage so stage comparisons are compile-checked'
      );

      // types/api.ts is legacy and slated for deletion; only assert if present,
      // so removing it does not fail this suite.
      if (existsSync(resolve(SRC_ROOT, 'types/api.ts'))) {
        const legacy = readSource('types/api.ts');
        assert(
          !/stage:\s*['"]/.test(legacy),
          'types/api.ts still declares an inline job-stage string union'
        );
      }
    }
  );
}
