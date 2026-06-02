const ZONE_LABELS = {
  money_king: 'Money King Zone',
  flex: 'Flex Zone',
  survivor: 'Survivor Zone',
  maintenance: 'Maintenance Zone',
  emergency: 'Emergency Snack Budget Mode',
};

export function buildRankInsight({ userId, userRecord, rankings }) {
  const balance = Number(userRecord?.balance || 0);
  const sorted = [...(rankings || [])].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
  const resolvedUserId = userId || userRecord?.user_id;
  const userIndex = sorted.findIndex((item) => item.user_id === resolvedUserId);
  const overallRank = userIndex >= 0 ? userIndex + 1 : sorted.filter((item) => Number(item.balance || 0) > balance).length + 1;
  const overallTotal = sorted.length || (userRecord ? 1 : 0);

  const nationality = userRecord?.nationality || 'en';
  const nationalList = sorted.filter((item) => item.nationality === nationality);
  const nationalIndex = nationalList.findIndex((item) => item.user_id === resolvedUserId);
  const nationalRank = nationalIndex >= 0 ? nationalIndex + 1 : nationalList.filter((item) => Number(item.balance || 0) > balance).length + 1;
  const nationalTotal = nationalList.length || (userRecord ? 1 : 0);

  const nextHigher = sorted[overallRank - 2];
  const tenth = sorted[9];
  const peopleAbove = Math.max(0, overallRank - 1);
  const peopleBelow = Math.max(0, overallTotal - overallRank);
  const percentileTop = overallTotal > 0 ? Math.ceil((overallRank / overallTotal) * 100) : 0;

  return {
    nickname: userRecord?.nickname || '',
    nationality,
    balance,
    overallRank,
    overallTotal,
    nationalRank,
    nationalTotal,
    percentileTop,
    peopleAbove,
    peopleBelow,
    gapToNextRank: nextHigher ? Math.max(0, Number(nextHigher.balance || 0) - balance + 1) : 0,
    gapToTop10: tenth && overallRank > 10 ? Math.max(0, Number(tenth.balance || 0) - balance + 1) : 0,
    balanceZone: getBalanceZone(percentileTop, overallRank),
  };
}

export function getBalanceZone(percentileTop, overallRank = null) {
  if (overallRank === 1 || percentileTop <= 5) return 'money_king';
  if (percentileTop <= 20) return 'flex';
  if (percentileTop <= 50) return 'survivor';
  if (percentileTop <= 80) return 'maintenance';
  return 'emergency';
}

export function buildFallbackRankReport(insight, locale = 'en') {
  const isKo = locale === 'ko';
  const zoneLabel = ZONE_LABELS[insight.balanceZone] || ZONE_LABELS.maintenance;
  const rankLine = isKo
    ? `전체 ${insight.overallTotal}명 중 ${insight.overallRank}등, 상위 ${insight.percentileTop}%입니다.`
    : `Rank #${insight.overallRank} of ${insight.overallTotal}, Top ${insight.percentileTop}%.`;
  const nextGapLine = insight.gapToNextRank > 0
    ? formatMoney(insight.gapToNextRank, locale)
    : isKo ? '이미 꼭대기라 다음 사람을 제낄 필요가 없습니다.' : 'Already at the top. No next target needed.';

  return {
    mainCopy: isKo
      ? `${zoneLabel}: 통장이 아직 캐릭터는 있습니다`
      : `${zoneLabel}: your wallet still has a plotline`,
    personaName: zoneLabel,
    personaDescription: isKo
      ? `지금 잔고는 ${zoneLabel}에 있습니다. 자랑하기엔 조심스럽지만, 익명 순위표에서는 일단 할 말이 생겼습니다.`
      : `Your balance sits in the ${zoneLabel}. Not exactly royal, but anonymous ranking gives it something to say.`,
    rankComment: isKo
      ? `${rankLine} 숫자가 아주 화려하진 않아도, 적어도 통장이 조용히 퇴장한 상태는 아닙니다.`
      : `${rankLine} Not spectacular, but your wallet has not left the chat.`,
    gapComment: isKo
      ? `다음 순위까지 필요한 금액은 ${nextGapLine}입니다. 이 정도면 큰돈 같기도 하고, 갑자기 편의점 장바구니가 수상해 보이기도 합니다.`
      : `Gap to the next rank: ${nextGapLine}. Small enough to annoy you, large enough to be real money.`,
    nationalityComment: isKo
      ? `같은 국적 안에서는 ${insight.nationalTotal}명 중 ${insight.nationalRank}등입니다. 표본이 작아도 순위는 순위라서 기분은 낼 수 있습니다.`
      : `Within your nationality: #${insight.nationalRank} of ${insight.nationalTotal}. A small pool still counts when the rank looks decent.`,
    positionMapComment: isKo
      ? `현재 ${insight.peopleBelow}명의 지갑이 당신 아래에 있습니다. 오늘만큼은 잔고도 사회적 위치를 가집니다.`
      : `${insight.peopleBelow} wallets are below yours. Today, even a balance gets social status.`,
    finalConclusion: isKo
      ? `종합하면, ${insight.nickname || '당신'}님의 통장은 완전히 무너진 쪽은 아닙니다. 상위권이라고 소리치기엔 애매하지만, 익명 리더보드에서 조용히 버틸 체력은 있습니다.`
      : `Overall, ${insight.nickname || 'your anonymous wallet'} is not collapsing. It may not be screaming luxury, but it has enough stamina for this leaderboard.`,
    shareCards: [
      {
        type: 'rank',
        title: isKo ? `가천대 익명 지갑 순위 #${insight.overallRank}` : `Gachon anonymous wallet rank #${insight.overallRank}`,
        subtitle: isKo ? `상위 ${insight.percentileTop}%. 통장이 오늘은 일했습니다.` : `Top ${insight.percentileTop}%. The wallet did some work today.`,
      },
      {
        type: 'zone',
        title: zoneLabel,
        subtitle: isKo ? '잔고가 캐릭터를 얻는 순간.' : 'The moment a balance gets a personality.',
      },
      {
        type: 'anonymous',
        title: isKo ? '닉네임만 공개하고 순위 확인 완료' : 'Rank checked with nickname only',
        subtitle: isKo ? '생각보다 덜 처참하거나, 처참해서 더 웃기거나.' : 'Either less tragic than expected, or tragic enough to share.',
      },
    ],
  };
}

export function normalizeRankReport(report, insight, locale = 'en') {
  const fallback = buildFallbackRankReport(insight, locale);
  const normalized = {
    mainCopy: cleanText(report?.mainCopy) || fallback.mainCopy,
    personaName: cleanText(report?.personaName) || fallback.personaName,
    personaDescription: cleanText(report?.personaDescription) || fallback.personaDescription,
    rankComment: cleanText(report?.rankComment) || fallback.rankComment,
    gapComment: cleanText(report?.gapComment) || fallback.gapComment,
    nationalityComment: cleanText(report?.nationalityComment) || fallback.nationalityComment,
    positionMapComment: cleanText(report?.positionMapComment) || fallback.positionMapComment,
    finalConclusion: cleanText(report?.finalConclusion) || fallback.finalConclusion,
    shareCards: normalizeShareCards(report?.shareCards, fallback.shareCards),
  };

  return normalized;
}

function normalizeShareCards(cards, fallbackCards) {
  const input = Array.isArray(cards) ? cards : [];
  const merged = fallbackCards.map((fallbackCard, index) => {
    const card = input[index] || {};
    return {
      type: cleanText(card.type) || fallbackCard.type,
      title: cleanText(card.title) || fallbackCard.title,
      subtitle: cleanText(card.subtitle) || fallbackCard.subtitle,
    };
  });
  return merged;
}

function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function formatMoney(value, locale) {
  const formatted = Number(value || 0).toLocaleString();
  if (locale === 'ko') return `₩${formatted}`;
  return `₩${formatted}`;
}
