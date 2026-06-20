import { getPlugin } from '@/lib/plugins/registry';
import type { PluginId } from '@/lib/plugins/types';

export type ScopeResult =
  | { allowed: true }
  | { allowed: false; message: string };

/** Tools exposed per workspace plugin id. */
export const AGENT_TOOLS_BY_PLUGIN: Record<PluginId, string[]> = {
  email: ['send_email', 'draft_email'],
  calendar: [
    'create_calendar_event',
    'list_calendar_events',
    'delete_calendar_event',
    'clear_calendar_schedule',
  ],
  github: [
    'list_github_pull_requests',
    'list_github_repos',
    'list_github_issues',
  ],
  drive: ['list_drive_recent_files', 'search_drive_files'],
};

/** Corsair tenant API substrings blocked when a plugin is not connected. */
export const CORSAIR_API_MARKERS_BY_PLUGIN: Record<PluginId, string[]> = {
  email: ['tenant.gmail', '.gmail.api', 'gmail.api'],
  calendar: ['tenant.googlecalendar', '.googlecalendar.api', 'googlecalendar.api'],
  github: ['tenant.github', '.github.api', 'github.api'],
  drive: ['tenant.googledrive', '.googledrive.api', 'googledrive.api'],
};

const CORE_MCP_TOOLS = new Set([
  'list_operations',
  'get_schema',
  'run_script',
  'corsair_setup',
]);

const ACCOUNT_TOOLS = new Set(['get_account_summary']);

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\bweather\b/i,
  /\bforecast\b/i,
  /\btemperature\b/i,
  /\b(stock market|crypto|bitcoin|ethereum|nft)\b/i,
  /\b(recipe|cook(ing)?|ingredients)\b/i,
  /\b(tell me a joke|write a poem|write a story|write an essay)\b/i,
  /\b(homework|coursework|thesis)\b/i,
  /\bwrite (me )?(a |some )?(python|javascript|typescript|java|c\+\+|rust|go|ruby|php|html|css|sql|c#|kotlin|swift) (code|script|function|program|app|class)\b/i,
  /\b(generate|give me|show me|provide) (the )?(code|source code|implementation|algorithm|snippet)\b/i,
  /\bhow (do|can|would) i (code|program|implement (in|using))\b/i,
  /\bdebug (this|my) code\b/i,
  /\bfibonacci\b/i,
  /\bleetcode\b/i,
  /\bstack overflow\b/i,
  /\btranslate (this|to)\b/i,
  /\bwho (is|was|are) (?!invited|attending|on the (call|meeting))\b/i,
  /\bwhat is the capital\b/i,
];

const PLUGIN_INTENT: Record<PluginId, RegExp[]> = {
  email: [
    /\b(email|e-mail|mail|inbox|gmail|outbox|draft|reply|forward|bcc|cc|unread)\b/i,
    /\bsend (an |a )?(email|mail|message)\b/i,
    /\b(check|read|summarize|search).{0,24}\b(inbox|mail|email)\b/i,
  ],
  calendar: [
    /\b(calendar|schedule|meeting|event|appointment|availab|remind|book|slot|agenda)\b/i,
    /\b(clear|delete|cancel).{0,20}\b(schedule|calendar|event|meeting)\b/i,
    /\b(today|tomorrow).{0,30}\b(meeting|event|schedule|calendar)\b/i,
  ],
  github: [
    /\bgithub\b/i,
    /\bpull requests?\b/i,
    /\bPRs?\b/,
    /\brepo(sitor(y|ies))?\b/i,
    /\bcommits?\b/i,
    /\bmerge (request|pull)\b/i,
    /\bissues?\s+(on|in|for)\b/i,
  ],
  drive: [
    /\bgoogle drive\b/i,
    /\bdrive files?\b/i,
    /\b(recent|search).{0,24}\b(files?|documents?)\b/i,
    /\b(find|share|open).{0,24}\b(file|document|folder|sheet|doc)\b/i,
  ],
};

const META_PATTERNS =
  /\b(what can you do|help|capabilities|who are you|what are you|how do you work|connect|integration|plugins?|supereye)\b/i;

/** Supereye account — plan, billing, tokens (always in scope for eye). */
export const SUPEREYE_ACCOUNT_PATTERNS: RegExp[] = [
  /\b(plan|subscription|billing|invoice|top[- ]?up|upgrade|downgrade|pricing)\b/i,
  /\b(token|wallet|allocation|usage)\b/i,
  /\bwhich plan\b/i,
  /\bwhat plan\b/i,
  /\bmy plan\b/i,
  /\bam i on\b/i,
  /\bhow many tokens\b/i,
  /\bmonthly (allocation|limit|tokens)\b/i,
  /\bremaining tokens\b/i,
];

const GREETING_PATTERN = /^(hi|hello|hey|thanks|thank you|ok|okay|yo|good morning|good evening)[!.?\s]*$/i;

export function isSupereyeAccountQuestion(text: string): boolean {
  return matchesAny(text.trim(), SUPEREYE_ACCOUNT_PATTERNS);
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function formatConnectedLabels(connected: PluginId[]): string {
  return connected
    .map((id) => getPlugin(id)?.label ?? id)
    .join(', ');
}

export function buildScopeRefusal(
  connected: PluginId[],
  reason: 'off-topic' | 'no-integrations'
): string {
  if (reason === 'no-integrations') {
    return (
      "I'm **eye**, your Supereye assistant. You haven't connected any integrations yet. " +
      'Connect **Gmail**, **Google Calendar**, **GitHub**, or **Google Drive** in **Settings → Connections**. ' +
      'After that, I can only help with those connected services — nothing else.'
    );
  }

  const labels = formatConnectedLabels(connected);
  return (
    `I'm **eye**, your Supereye assistant. I only help with your connected integrations (**${labels}**). ` +
    "I can't answer coding questions, weather, general knowledge, creative writing, or anything outside those services."
  );
}

function detectPluginIntents(text: string): Set<PluginId> {
  const found = new Set<PluginId>();
  for (const [plugin, patterns] of Object.entries(PLUGIN_INTENT) as [
    PluginId,
    RegExp[],
  ][]) {
    if (matchesAny(text, patterns)) {
      found.add(plugin);
    }
  }
  return found;
}

export function evaluateAgentScope(
  message: string,
  connectedPlugins: PluginId[]
): ScopeResult {
  const text = message.trim();
  if (!text) {
    return { allowed: false, message: 'Please enter a message.' };
  }

  if (isSupereyeAccountQuestion(text)) {
    return { allowed: true };
  }

  const isMeta = META_PATTERNS.test(text);
  const isGreeting = GREETING_PATTERN.test(text);

  if (connectedPlugins.length === 0) {
    if (isMeta || isGreeting) return { allowed: true };
    return { allowed: false, message: buildScopeRefusal([], 'no-integrations') };
  }

  if (isGreeting || (isMeta && !matchesAny(text, OFF_TOPIC_PATTERNS))) {
    return { allowed: true };
  }

  const intents = detectPluginIntents(text);
  const offTopic = matchesAny(text, OFF_TOPIC_PATTERNS);

  if (offTopic) {
    const hasConnectedIntent = [...intents].some((id) =>
      connectedPlugins.includes(id)
    );
    if (!hasConnectedIntent) {
      return {
        allowed: false,
        message: buildScopeRefusal(connectedPlugins, 'off-topic'),
      };
    }
  }

  if (intents.size > 0) {
    const disconnected = [...intents].filter(
      (id) => !connectedPlugins.includes(id)
    );
    const connected = [...intents].filter((id) =>
      connectedPlugins.includes(id)
    );

    if (connected.length === 0 && disconnected.length > 0) {
      const label = getPlugin(disconnected[0])?.label ?? disconnected[0];
      return {
        allowed: false,
        message:
          `That requires **${label}**, which isn't connected. Connect it in **Settings → Connections**. ` +
          `I can currently help with: **${formatConnectedLabels(connectedPlugins)}**.`,
      };
    }

    return { allowed: true };
  }

  if (offTopic) {
    return {
      allowed: false,
      message: buildScopeRefusal(connectedPlugins, 'off-topic'),
    };
  }

  return { allowed: true };
}

export function getAllowedAgentToolNames(
  connectedPlugins: PluginId[],
  interactiveMode?: boolean
): Set<string> {
  const allowed = new Set<string>([...ACCOUNT_TOOLS, ...CORE_MCP_TOOLS]);

  for (const pluginId of connectedPlugins) {
    for (const toolName of AGENT_TOOLS_BY_PLUGIN[pluginId] ?? []) {
      allowed.add(toolName);
    }
  }

  if (!interactiveMode) {
    allowed.delete('draft_email');
  }

  if (!connectedPlugins.includes('email')) {
    allowed.delete('send_email');
    allowed.delete('draft_email');
  }

  if (connectedPlugins.length === 0) {
    return new Set(ACCOUNT_TOOLS);
  }

  return allowed;
}

export function filterAgentToolSet<T extends Record<string, unknown>>(
  tools: T,
  connectedPlugins: PluginId[],
  interactiveMode?: boolean
): Partial<T> {
  const allowed = getAllowedAgentToolNames(connectedPlugins, interactiveMode);

  const filtered: Partial<T> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    if (allowed.has(name)) {
      (filtered as Record<string, unknown>)[name] = toolDef;
    }
  }
  return filtered;
}

export function assertRunScriptPluginAccess(
  code: string,
  connectedPlugins: PluginId[]
): void {
  const allPlugins: PluginId[] = ['email', 'calendar', 'github', 'drive'];
  const disconnected = allPlugins.filter((id) => !connectedPlugins.includes(id));

  for (const pluginId of disconnected) {
    for (const marker of CORSAIR_API_MARKERS_BY_PLUGIN[pluginId] ?? []) {
      if (code.includes(marker)) {
        const label = getPlugin(pluginId)?.label ?? pluginId;
        throw new Error(
          `${label} is not connected. Connect it in Settings → Connections.`
        );
      }
    }
  }
}
