import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_NAME = Deno.env.get("VERTEX_AI_MODEL") || "gemini-2.5-flash";
const VERTEX_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const SUPPORTED_LOCALES = ["ko", "en", "vi", "zh", "mn", "uz", "ja"];

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startedAt = Date.now();
  let requestId = createRequestId();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { filePath, userId, locale, requestId: bodyRequestId } = await req.json();
    requestId = normalizeRequestId(bodyRequestId) || requestId;
    if (!filePath || !userId) {
      throw new Error("Missing filePath or userId");
    }
    const reportLocale = normalizeLocale(locale);
    logFunctionEvent(requestId, 'verify_balance_started', {
      stage: 'request_received',
      locale: reportLocale,
    });

    // 1. Download screenshot file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('screenshots')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download screenshot: ${downloadError?.message || 'No data'}`);
    }
    logFunctionEvent(requestId, 'screenshot_downloaded', {
      stage: 'storage_downloaded',
      mime_type: fileData.type || 'unknown',
      size_bucket: sizeBucket(fileData.size),
    });

    // Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Image = btoa(binary);

    // 2. Prepare Vertex AI Gemini client
    const vertexClient = await createVertexClient();
    logFunctionEvent(requestId, 'vertex_client_ready', {
      stage: 'vertex_auth',
      model: MODEL_NAME,
    });

    const promptText = `
      Analyze this image which is expected to be a mobile banking screenshot showing a bank account balance.
      Identify if the image contains a mobile banking screen showing a balance.
      If it does not look like a bank account statement/balance screen, set is_bank_statement to false.
      If it does, set is_bank_statement to true, identify the primary total balance amount, and return the balance as a whole integer (without commas or currency symbols).
      
      Return your response in strict JSON format matching this schema:
      {
        "is_bank_statement": boolean,
        "balance": number
      }
    `;

    const responseText = await generateContent(vertexClient, {
      parts: [
        { text: promptText },
        {
          inlineData: {
            mimeType: fileData.type || "image/png",
            data: base64Image
          }
        }
      ],
      responseMimeType: "application/json",
    });

    // Parse output JSON
    const parsedResult = JSON.parse(responseText.trim());
    const isVerified = parsedResult.is_bank_statement === true;
    const extractedBalance = Number(parsedResult.balance) || 0;
    logFunctionEvent(requestId, 'vertex_balance_completed', {
      stage: 'balance_analysis',
      verified: isVerified,
    });

    // 4. Update the Leaderboard record in Supabase DB
    // Get user details to cache nickname and nationality
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nickname, nationality')
      .eq('id', userId)
      .single();

    const publicUrl = supabaseClient.storage.from('screenshots').getPublicUrl(filePath).data.publicUrl;

    const { error: upsertError } = await supabaseClient
      .from('leaderboard')
      .upsert({
        user_id: userId,
        nickname: profile?.nickname || 'Anonymous',
        nationality: profile?.nationality || 'en',
        balance: isVerified ? extractedBalance : 0,
        screenshot_url: publicUrl,
        status: isVerified ? 'verified' : 'rejected',
        result_report_json: null,
        result_report_generated_at: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      throw new Error(`Failed to update leaderboard: ${upsertError.message}`);
    }
    logFunctionEvent(requestId, 'leaderboard_upserted', {
      stage: 'database_upsert',
      verified: isVerified,
    });

    let rankInsight = null;
    let rankReport = null;

    if (isVerified) {
      const { data: verifiedRows } = await supabaseClient
        .from('leaderboard')
        .select('id, user_id, nickname, nationality, balance')
        .eq('status', 'verified')
        .order('balance', { ascending: false });

      const currentRecord = {
        user_id: userId,
        nickname: profile?.nickname || 'Anonymous',
        nationality: profile?.nationality || 'en',
        balance: extractedBalance,
      };
      rankInsight = buildRankInsight({
        userId,
        userRecord: currentRecord,
        rankings: ensureCurrentRow(verifiedRows || [], currentRecord),
      });

      const fallbackReport = buildFallbackRankReport(rankInsight, reportLocale);
      try {
        const generatedReport = await generateRankReport({
          vertexClient,
          insight: rankInsight,
          locale: reportLocale,
        });
        rankReport = normalizeRankReport(generatedReport, fallbackReport);
      } catch (_reportError) {
        logFunctionEvent(requestId, 'rank_report_failed', {
          stage: 'rank_report',
          error_code: errorCode(_reportError),
        }, 'error');
        rankReport = fallbackReport;
      }

      await supabaseClient
        .from('leaderboard')
        .update({
          result_report_json: rankReport,
          result_report_generated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      logFunctionEvent(requestId, 'rank_report_saved', {
        stage: 'rank_report',
      });
    }

    logFunctionEvent(requestId, 'verify_balance_completed', {
      stage: 'completed',
      verified: isVerified,
      duration_ms: Date.now() - startedAt,
    });
    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: isVerified, 
        balance: extractedBalance,
        rankInsight,
        rankReport,
        requestId,
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (err) {
    logFunctionEvent(requestId, 'verify_balance_failed', {
      stage: 'failed',
      error_code: errorCode(err),
      duration_ms: Date.now() - startedAt,
    }, 'error');
    return new Response(
      JSON.stringify({ success: false, error: errorMessage(err), requestId }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function logFunctionEvent(
  requestId: string,
  stage: string,
  properties: Record<string, unknown> = {},
  level: 'info' | 'error' = 'info',
) {
  const { stage: step, ...safeProperties } = sanitizeLogProperties(properties);
  const payload = {
    source: 'verify-balance',
    requestId,
    stage,
    step,
    ...safeProperties,
    timestamp: new Date().toISOString(),
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }
  console.info(JSON.stringify(payload));
}

function sanitizeLogProperties(properties: Record<string, unknown>) {
  const blocked = /(phone|email|name|nick|avatar|screen|image|token|secret|credential|key|amount|money|asset|balance|file|path|user)/i;
  const sanitized: Record<string, unknown> = {};
  for (const [property, value] of Object.entries(properties)) {
    if (blocked.test(property)) continue;
    if (value === undefined || typeof value === 'function') continue;
    if (typeof value === 'string') sanitized[property] = value.slice(0, 120);
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) sanitized[property] = value;
    else sanitized[property] = String(value).slice(0, 120);
  }
  return sanitized;
}

function createRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function normalizeRequestId(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^\w-]/g, '').slice(0, 96);
}

function sizeBucket(bytes = 0) {
  const size = Number(bytes) || 0;
  if (size <= 0) return 'unknown';
  if (size < 500_000) return '<500kb';
  if (size < 2_000_000) return '500kb-2mb';
  if (size < 5_000_000) return '2mb-5mb';
  return '5mb+';
}

function errorCode(error: unknown) {
  return errorMessage(error)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'unknown_error';
}

function normalizeLocale(value: unknown) {
  if (typeof value !== "string") return "en";
  const shortLocale = value.split("-")[0].toLowerCase();
  return SUPPORTED_LOCALES.includes(shortLocale) ? shortLocale : "en";
}

function ensureCurrentRow(rows: Array<Record<string, unknown>>, currentRecord: Record<string, unknown>) {
  const withoutCurrent = rows.filter((row) => row.user_id !== currentRecord.user_id);
  return [...withoutCurrent, currentRecord];
}

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type VertexClient = {
  endpoint: string;
  accessToken: string;
};

async function createVertexClient(): Promise<VertexClient> {
  const useVertex = (Deno.env.get("GOOGLE_GENAI_USE_VERTEXAI") || "").toLowerCase();
  if (useVertex !== "true") {
    throw new Error("GOOGLE_GENAI_USE_VERTEXAI must be set to true for Vertex AI Gemini calls");
  }

  const project = Deno.env.get("GOOGLE_CLOUD_PROJECT");
  if (!project) {
    throw new Error("GOOGLE_CLOUD_PROJECT is not configured");
  }

  const location = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "global";
  const serviceAccount = await loadServiceAccountKey();
  const accessToken = await createServiceAccountAccessToken(serviceAccount);

  return {
    endpoint: buildVertexGenerateContentEndpoint(project, location, MODEL_NAME),
    accessToken,
  };
}

async function loadServiceAccountKey(): Promise<ServiceAccountKey> {
  const encodedKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64");
  const credentialsPath = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS");

  let rawJson = "";
  if (encodedKey) {
    rawJson = atob(encodedKey.replace(/\s/g, ""));
  } else if (credentialsPath) {
    rawJson = await Deno.readTextFile(credentialsPath);
  } else {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 or GOOGLE_APPLICATION_CREDENTIALS is required for Vertex AI");
  }

  const parsed = JSON.parse(rawJson) as Partial<ServiceAccountKey>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Google service account key is missing client_email or private_key");
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    token_uri: parsed.token_uri || DEFAULT_TOKEN_URI,
  };
}

function buildVertexGenerateContentEndpoint(project: string, location: string, model: string) {
  const host = location === "global"
    ? "aiplatform.googleapis.com"
    : `${location}-aiplatform.googleapis.com`;

  return `https://${host}/v1/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(model)}:generateContent`;
}

async function createServiceAccountAccessToken(serviceAccount: ServiceAccountKey) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri || DEFAULT_TOKEN_URI;
  const assertion = await createSignedJwt({
    header: {
      alg: "RS256",
      typ: "JWT",
    },
    payload: {
      iss: serviceAccount.client_email,
      scope: VERTEX_SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    },
    privateKeyPem: serviceAccount.private_key,
  });

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Vertex AI authentication failed: ${await response.text()}`);
  }

  const data = await response.json() as { access_token?: unknown };
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("Vertex AI authentication returned no access token");
  }

  return data.access_token;
}

async function createSignedJwt({ header, payload, privateKeyPem }: {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  privateKeyPem: string;
}) {
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function generateContent(vertexClient: VertexClient, { parts, responseMimeType }: {
  parts: Array<Record<string, unknown>>;
  responseMimeType: string;
}) {
  const response = await fetch(vertexClient.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${vertexClient.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        responseMimeType,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Vertex AI Gemini returned error: ${await response.text()}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: unknown }>;
      };
    }>;
  };
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof responseText !== "string" || !responseText.trim()) {
    throw new Error("Vertex AI Gemini returned an empty response");
  }
  return responseText;
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildRankInsight({ userId, userRecord, rankings }: {
  userId: string;
  userRecord: Record<string, unknown>;
  rankings: Array<Record<string, unknown>>;
}) {
  const balance = Number(userRecord.balance || 0);
  const sorted = [...rankings].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
  const userIndex = sorted.findIndex((item) => item.user_id === userId);
  const overallRank = userIndex >= 0 ? userIndex + 1 : sorted.filter((item) => Number(item.balance || 0) > balance).length + 1;
  const overallTotal = sorted.length || 1;
  const nationality = String(userRecord.nationality || "en");
  const nationalList = sorted.filter((item) => item.nationality === nationality);
  const nationalIndex = nationalList.findIndex((item) => item.user_id === userId);
  const nationalRank = nationalIndex >= 0 ? nationalIndex + 1 : nationalList.filter((item) => Number(item.balance || 0) > balance).length + 1;
  const nationalTotal = nationalList.length || 1;
  const nextHigher = sorted[overallRank - 2];
  const tenth = sorted[9];
  const percentileTop = Math.ceil((overallRank / overallTotal) * 100);

  return {
    nickname: String(userRecord.nickname || "Anonymous"),
    nationality,
    balance,
    overallRank,
    overallTotal,
    nationalRank,
    nationalTotal,
    percentileTop,
    peopleAbove: Math.max(0, overallRank - 1),
    peopleBelow: Math.max(0, overallTotal - overallRank),
    gapToNextRank: nextHigher ? Math.max(0, Number(nextHigher.balance || 0) - balance + 1) : 0,
    gapToTop10: tenth && overallRank > 10 ? Math.max(0, Number(tenth.balance || 0) - balance + 1) : 0,
    balanceZone: getBalanceZone(percentileTop, overallRank),
  };
}

function getBalanceZone(percentileTop: number, overallRank: number) {
  if (overallRank === 1 || percentileTop <= 5) return "money_king";
  if (percentileTop <= 20) return "flex";
  if (percentileTop <= 50) return "survivor";
  if (percentileTop <= 80) return "maintenance";
  return "emergency";
}

async function generateRankReport({ vertexClient, insight, locale }: {
  vertexClient: VertexClient;
  insight: Record<string, unknown>;
  locale: string;
}) {
  const promptText = `
You write humorous, spicy result copy for an anonymous campus bank-balance ranking service.

Tone:
- Funny, sharp, lightly mocking.
- Similar to a roast report, but no severe profanity.
- Do not insult nationality, ethnicity, gender, religion, disability, or real identity.
- Mock the wallet situation, rank, and leaderboard position only.
- Use short punchy lines that are easy to share.
- Avoid corporate or polite marketing tone.
- The result should feel like a playful anonymous internet ranking, not financial advice.

Write in this locale: ${locale}.
Do not mention Gemini, AI model, database, storage, or internal operations.
Do not say the service is unofficial.
Do not ask the user to hide account details.
The public identity is nickname + nationality only.

Use the numeric facts exactly. Do not invent ranks, balances, or totals.

Input:
${JSON.stringify(insight)}

Return strict JSON:
{
  "mainCopy": "string",
  "personaName": "string",
  "personaDescription": "string",
  "rankComment": "string",
  "gapComment": "string",
  "nationalityComment": "string",
  "positionMapComment": "string",
  "finalConclusion": "string",
  "shareCards": [
    { "type": "rank", "title": "string", "subtitle": "string" },
    { "type": "zone", "title": "string", "subtitle": "string" },
    { "type": "anonymous", "title": "string", "subtitle": "string" }
  ]
}
`;

  const responseText = await generateContent(vertexClient, {
    parts: [{ text: promptText }],
    responseMimeType: "application/json",
  });
  return JSON.parse(responseText.trim());
}

function normalizeRankReport(report: Record<string, unknown>, fallback: Record<string, unknown>) {
  const fallbackCards = Array.isArray(fallback.shareCards) ? fallback.shareCards : [];
  const reportCards = Array.isArray(report?.shareCards) ? report.shareCards : [];
  return {
    mainCopy: cleanText(report?.mainCopy) || fallback.mainCopy,
    personaName: cleanText(report?.personaName) || fallback.personaName,
    personaDescription: cleanText(report?.personaDescription) || fallback.personaDescription,
    rankComment: cleanText(report?.rankComment) || fallback.rankComment,
    gapComment: cleanText(report?.gapComment) || fallback.gapComment,
    nationalityComment: cleanText(report?.nationalityComment) || fallback.nationalityComment,
    positionMapComment: cleanText(report?.positionMapComment) || fallback.positionMapComment,
    finalConclusion: cleanText(report?.finalConclusion) || fallback.finalConclusion,
    shareCards: fallbackCards.map((fallbackCard: Record<string, unknown>, index: number) => {
      const card = (reportCards[index] || {}) as Record<string, unknown>;
      return {
        type: cleanText(card.type) || fallbackCard.type,
        title: cleanText(card.title) || fallbackCard.title,
        subtitle: cleanText(card.subtitle) || fallbackCard.subtitle,
      };
    }),
  };
}

function buildFallbackRankReport(insight: Record<string, unknown>, locale: string) {
  const isKo = locale === "ko";
  const zoneName = zoneLabel(String(insight.balanceZone || "maintenance"));
  return {
    mainCopy: isKo ? `${zoneName}: 통장이 아직 캐릭터는 있습니다` : `${zoneName}: your wallet still has a plotline`,
    personaName: zoneName,
    personaDescription: isKo
      ? `지금 잔고는 ${zoneName}에 있습니다. 자랑하기엔 조심스럽지만, 익명 순위표에서는 일단 할 말이 생겼습니다.`
      : `Your balance sits in the ${zoneName}. Not royal, but anonymous ranking gives it something to say.`,
    rankComment: isKo
      ? `전체 ${insight.overallTotal}명 중 ${insight.overallRank}등, 상위 ${insight.percentileTop}%입니다. 숫자가 화려하진 않아도 통장이 조용히 퇴장한 상태는 아닙니다.`
      : `Rank #${insight.overallRank} of ${insight.overallTotal}, Top ${insight.percentileTop}%. Your wallet has not left the chat.`,
    gapComment: Number(insight.gapToNextRank || 0) > 0
      ? isKo
        ? `다음 순위까지 ${formatKrw(insight.gapToNextRank)} 필요합니다. 큰돈 같기도 하고, 편의점 장바구니가 수상해 보이기도 합니다.`
        : `Gap to the next rank: ${formatKrw(insight.gapToNextRank)}. Small enough to annoy you, large enough to be real money.`
      : isKo
        ? "이미 꼭대기라 다음 사람을 제낄 필요가 없습니다. 오늘은 통장이 먼저 퇴근해도 됩니다."
        : "Already at the top. Your wallet can clock out early today.",
    nationalityComment: isKo
      ? `같은 국적 안에서는 ${insight.nationalTotal}명 중 ${insight.nationalRank}등입니다. 표본이 작아도 순위는 순위입니다.`
      : `Within your nationality: #${insight.nationalRank} of ${insight.nationalTotal}. A small pool still counts when the rank looks decent.`,
    positionMapComment: isKo
      ? `현재 ${insight.peopleBelow}명의 지갑이 당신 아래에 있습니다. 오늘만큼은 잔고도 사회적 위치를 가집니다.`
      : `${insight.peopleBelow} wallets are below yours. Today, even a balance gets social status.`,
    finalConclusion: isKo
      ? `종합하면, ${insight.nickname || "당신"}님의 통장은 완전히 무너진 쪽은 아닙니다. 상위권이라고 소리치기엔 애매하지만, 익명 리더보드에서 조용히 버틸 체력은 있습니다.`
      : `Overall, ${insight.nickname || "your anonymous wallet"} is not collapsing. It may not scream luxury, but it has enough stamina for this leaderboard.`,
    shareCards: [
      {
        type: "rank",
        title: isKo ? `가천대 익명 지갑 순위 #${insight.overallRank}` : `Gachon anonymous wallet rank #${insight.overallRank}`,
        subtitle: isKo ? `상위 ${insight.percentileTop}%. 통장이 오늘은 일했습니다.` : `Top ${insight.percentileTop}%. The wallet did some work today.`,
      },
      {
        type: "zone",
        title: zoneName,
        subtitle: isKo ? "잔고가 캐릭터를 얻는 순간." : "The moment a balance gets a personality.",
      },
      {
        type: "anonymous",
        title: isKo ? "닉네임만 공개하고 순위 확인 완료" : "Rank checked with nickname only",
        subtitle: isKo ? "생각보다 덜 처참하거나, 처참해서 더 웃기거나." : "Either less tragic than expected, or tragic enough to share.",
      },
    ],
  };
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function zoneLabel(zone: string) {
  const labels: Record<string, string> = {
    money_king: "Money King Zone",
    flex: "Flex Zone",
    survivor: "Survivor Zone",
    maintenance: "Maintenance Zone",
    emergency: "Emergency Snack Budget Mode",
  };
  return labels[zone] || labels.maintenance;
}

function formatKrw(value: unknown) {
  return `₩${Number(value || 0).toLocaleString()}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
