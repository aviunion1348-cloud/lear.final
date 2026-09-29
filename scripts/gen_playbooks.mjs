#!/usr/bin/env node
/* =============================================================================
   PLAYBOOK CATALOGUE GENERATOR
   -----------------------------------------------------------------------------
   Emits desktop/src/lib/playbooks.generated.ts — the searchable catalogue behind
   the command palette (Cmd/Ctrl+K).

   Design rule, and the reason this file is boring on purpose:

     A playbook is only marked `executable` when prash actually ships an action
     module that can run it. Everything else is `executable: false` and carries
     a `cli` hint instead.

   It would have been easy to generate 1,000 entries that all claim to run. That
   produces a catalogue that looks enormous and lies — you'd click "Roll back
   deployment" and get nothing. The split below is checked by a test against the
   real prash/actions directory, so the claim stays true as the backend grows.

   Deterministic: same input -> byte-identical output. Safe to re-run in CI.
   ========================================================================== */

import { writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'desktop/src/lib/playbooks.generated.ts');
const ACTIONS_DIR = resolve(ROOT, 'prash/actions');

/* -- which actions really exist -------------------------------------------- */
const ACTION_MODULES = existsSync(ACTIONS_DIR)
  ? readdirSync(ACTIONS_DIR)
      .filter((f) => f.endsWith('.py') && !f.startsWith('__'))
      .map((f) => f.replace(/\.py$/, ''))
      .sort()
  : [];

const has = (mod) => ACTION_MODULES.includes(mod);

/* -- the 14 connectors prash ships ----------------------------------------- */
const CONNECTORS = [
  { id: 'aws',        name: 'AWS',         category: 'infrastructure' },
  { id: 'azure',      name: 'Azure',       category: 'infrastructure' },
  { id: 'gcp',        name: 'GCP',         category: 'infrastructure' },
  { id: 'kubernetes', name: 'Kubernetes',  category: 'infrastructure' },
  { id: 'github',     name: 'GitHub',      category: 'cicd' },
  { id: 'gitlab',     name: 'GitLab',      category: 'cicd' },
  { id: 'vercel',     name: 'Vercel',      category: 'cicd' },
  { id: 'terraform',  name: 'Terraform',   category: 'iac' },
  { id: 'datadog',    name: 'Datadog',     category: 'monitoring' },
  { id: 'grafana',    name: 'Grafana',     category: 'monitoring' },
  { id: 'pagerduty',  name: 'PagerDuty',   category: 'monitoring' },
  { id: 'snyk',       name: 'Snyk',        category: 'security' },
  { id: 'gitleaks',   name: 'Gitleaks',    category: 'security' },
  { id: 'prash',      name: 'Lear Core',   category: 'platform' },
];

/* -- operation templates ----------------------------------------------------
   `action` names a prash/actions module. If that module isn't present the
   playbook is emitted as guidance (executable:false) rather than a false
   promise.                                                                   */
const OPS = {
  infrastructure: [
    { verb: 'Restart',        obj: 'workload',            action: 'restart_pod',   risk: 'medium', intent: 'remediate' },
    { verb: 'Scale',          obj: 'capacity',            action: 'scale',         risk: 'medium', intent: 'remediate' },
    { verb: 'Roll back',      obj: 'last deployment',     action: 'rollback',      risk: 'high',   intent: 'remediate' },
    { verb: 'Drain',          obj: 'node',                action: null,            risk: 'high',   intent: 'remediate' },
    { verb: 'Cordon',         obj: 'node',                action: null,            risk: 'medium', intent: 'remediate' },
    { verb: 'Audit',          obj: 'idle spend',          action: null,            risk: 'low',    intent: 'investigate' },
    { verb: 'Inspect',        obj: 'resource quota',      action: null,            risk: 'low',    intent: 'investigate' },
    { verb: 'Snapshot',       obj: 'volume state',        action: null,            risk: 'low',    intent: 'investigate' },
    { verb: 'Diff',           obj: 'live vs declared',    action: null,            risk: 'low',    intent: 'investigate' },
    { verb: 'Trace',          obj: 'network path',        action: null,            risk: 'low',    intent: 'investigate' },
    { verb: 'Raise alert on', obj: 'health regression',   action: 'aws_alert',     risk: 'low',    intent: 'notify' },
    { verb: 'Execute',        obj: 'operational command', action: 'exec_command',  risk: 'high',   intent: 'remediate' },
  ],
  cicd: [
    { verb: 'Re-run',       obj: 'failed pipeline',     action: null,                risk: 'low',    intent: 'remediate' },
    { verb: 'Cancel',       obj: 'queued run',          action: null,                risk: 'low',    intent: 'remediate' },
    { verb: 'Apply fix to', obj: 'broken CI config',    action: 'apply_ci_fix',      risk: 'medium', intent: 'remediate' },
    { verb: 'Open PR for',  obj: 'proposed remedy',     action: 'open_pr',           risk: 'medium', intent: 'remediate' },
    { verb: 'Promote',      obj: 'build to production', action: 'vercel_deploy',     risk: 'high',   intent: 'remediate' },
    { verb: 'Bisect',       obj: 'first failing commit',action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Summarise',    obj: 'failure log',         action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Audit',        obj: 'pipeline duration',   action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Detect',       obj: 'flaky tests',         action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Alert on',     obj: 'pipeline breakage',   action: 'github_alert',      risk: 'low',    intent: 'notify' },
  ],
  iac: [
    { verb: 'Initialise', obj: 'working directory', action: 'terraform_init',  risk: 'low',    intent: 'investigate' },
    { verb: 'Plan',       obj: 'pending changes',   action: null,              risk: 'low',    intent: 'investigate' },
    { verb: 'Apply',      obj: 'approved plan',     action: 'terraform_apply', risk: 'high',   intent: 'remediate' },
    { verb: 'Detect',     obj: 'state drift',       action: null,              risk: 'low',    intent: 'investigate' },
    { verb: 'Lock',       obj: 'remote state',      action: null,              risk: 'medium', intent: 'remediate' },
    { verb: 'Audit',      obj: 'module versions',   action: null,              risk: 'low',    intent: 'investigate' },
    { verb: 'Estimate',   obj: 'cost of change',    action: null,              risk: 'low',    intent: 'investigate' },
    { verb: 'Validate',   obj: 'policy compliance', action: null,              risk: 'low',    intent: 'investigate' },
  ],
  monitoring: [
    { verb: 'Silence',    obj: 'noisy alert',        action: 'grafana_silence',     risk: 'medium', intent: 'remediate' },
    { verb: 'Mute',       obj: 'monitor',            action: 'datadog_mute',        risk: 'medium', intent: 'remediate' },
    { verb: 'Page',       obj: 'on-call engineer',   action: 'pagerduty_page',      risk: 'medium', intent: 'notify' },
    { verb: 'Open',       obj: 'incident',           action: 'pagerduty_incident',  risk: 'medium', intent: 'notify' },
    { verb: 'Correlate',  obj: 'alert storm',        action: null,                  risk: 'low',    intent: 'investigate' },
    { verb: 'Chart',      obj: 'error budget burn',  action: null,                  risk: 'low',    intent: 'investigate' },
    { verb: 'Compare',    obj: 'week-over-week p99', action: null,                  risk: 'low',    intent: 'investigate' },
    { verb: 'Find',       obj: 'unowned dashboards', action: null,                  risk: 'low',    intent: 'investigate' },
    { verb: 'Alert on',   obj: 'SLO breach',         action: 'datadog_alert',       risk: 'low',    intent: 'notify' },
  ],
  security: [
    { verb: 'Scan',      obj: 'dependency tree',     action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Escalate',  obj: 'leaked credential',   action: 'gitleaks_escalate', risk: 'high',   intent: 'notify' },
    { verb: 'Ignore',    obj: 'accepted finding',    action: 'snyk_ignore',       risk: 'medium', intent: 'remediate' },
    { verb: 'Rotate',    obj: 'exposed secret',      action: null,                risk: 'high',   intent: 'remediate' },
    { verb: 'Report',    obj: 'severity breakdown',  action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Diff',      obj: 'new findings',        action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Check',     obj: 'licence compliance',  action: null,                risk: 'low',    intent: 'investigate' },
    { verb: 'Detect',    obj: 'missing secret',      action: 'missing_secret',    risk: 'medium', intent: 'investigate' },
  ],
  platform: [
    { verb: 'Edit',     obj: 'watcher configuration', action: 'edit_config', risk: 'medium', intent: 'remediate' },
    { verb: 'Explain',  obj: 'root cause',            action: null,          risk: 'low',    intent: 'investigate' },
    { verb: 'Replay',   obj: 'incident timeline',     action: null,          risk: 'low',    intent: 'investigate' },
    { verb: 'Export',   obj: 'post-mortem draft',     action: null,          risk: 'low',    intent: 'investigate' },
    { verb: 'Simulate', obj: 'failure injection',     action: null,          risk: 'high',   intent: 'investigate' },
    { verb: 'Tune',     obj: 'alert thresholds',      action: null,          risk: 'medium', intent: 'remediate' },
  ],
};

/* -- the axes we multiply operations across -------------------------------- */
const ENVIRONMENTS = ['production', 'staging', 'development'];
const SCOPES = [
  { id: 'service',   label: 'a single service' },
  { id: 'namespace', label: 'a namespace' },
  { id: 'region',    label: 'a region' },
  { id: 'account',   label: 'the whole account' },
];

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* -- build ------------------------------------------------------------------ */
const playbooks = [];
let n = 0;

for (const c of CONNECTORS) {
  const ops = OPS[c.category] ?? [];
  for (const op of ops) {
    for (const env of ENVIRONMENTS) {
      for (const scope of SCOPES) {
        // account-wide destructive work is not a thing we offer as one click
        if (scope.id === 'account' && op.risk === 'high') continue;

        const title = `${op.verb} ${op.obj} — ${c.name} · ${env}`;
        const id = slug(`${c.id}-${op.verb}-${op.obj}-${env}-${scope.id}`);
        const executable = Boolean(op.action && has(op.action));

        playbooks.push({
          id,
          title,
          connector: c.id,
          connectorName: c.name,
          category: c.category,
          environment: env,
          scope: scope.id,
          intent: op.intent,
          risk: op.risk,
          action: op.action ?? null,
          executable,
          summary: `${op.verb} ${op.obj} across ${scope.label} in ${env} using the ${c.name} connector.`,
          cli: `prash run ${c.id} ${slug(op.verb + '-' + op.obj)} --env ${env} --scope ${scope.id}`,
          keywords: [c.id, c.name, op.verb, op.obj, env, scope.id, op.intent, op.risk]
            .join(' ')
            .toLowerCase(),
        });
        n++;
      }
    }
  }
}

const executableCount = playbooks.filter((p) => p.executable).length;

const banner = `/* =============================================================================
   GENERATED FILE — do not edit by hand.
   Run \`node scripts/gen_playbooks.mjs\` to regenerate.

   ${playbooks.length} playbooks across ${CONNECTORS.length} connectors.
   ${executableCount} are backed by a real prash/actions module and can run.
   ${playbooks.length - executableCount} are guided procedures: they carry a CLI
   command and open the right view, but they do not claim to execute.

   That split is asserted by src/__tests__/Playbooks.test.ts against the actual
   contents of prash/actions, so it cannot quietly drift into a lie.
   ========================================================================== */

export interface Playbook {
  id: string;
  title: string;
  connector: string;
  connectorName: string;
  category: string;
  environment: string;
  scope: string;
  intent: 'remediate' | 'investigate' | 'notify';
  risk: 'low' | 'medium' | 'high';
  /** prash/actions module name, when one backs this playbook. */
  action: string | null;
  /** True only when \`action\` names a module that actually ships. */
  executable: boolean;
  summary: string;
  cli: string;
  keywords: string;
}

export const PLAYBOOK_COUNT = ${playbooks.length};
export const PLAYBOOK_EXECUTABLE_COUNT = ${executableCount};
export const PLAYBOOK_CONNECTORS = ${JSON.stringify(CONNECTORS.map((c) => c.id))};

export const PLAYBOOKS: Playbook[] = ${JSON.stringify(playbooks, null, 0)};

export default PLAYBOOKS;
`;

writeFileSync(OUT, banner);
console.log(
  `wrote ${OUT}\n  ${playbooks.length} playbooks · ${executableCount} executable · ` +
    `${playbooks.length - executableCount} guided\n  actions found: ${ACTION_MODULES.length}`,
);
