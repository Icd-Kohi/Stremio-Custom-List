const metadataBaseUrl = process.env.METADATA_BASE_URL || "https://v3-cinemeta.strem.io";
const metadataDisabled = process.env.DISABLE_REMOTE_METADATA === "1";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeGenres(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((genre) => normalizeText(genre))
    .filter(Boolean);
}

function buildMetaHubImageUrl(kind, stremioId) {
  if (!/^tt\d+$/.test(stremioId)) {
    return "";
  }

  return `https://images.metahub.space/${kind}/medium/${encodeURIComponent(stremioId)}/img`;
}

function toItemMetadata(meta, stremioId) {
  return {
    itemName: normalizeText(meta?.name) || stremioId,
    poster: normalizeText(meta?.poster) || buildMetaHubImageUrl("poster", stremioId),
    background: normalizeText(meta?.background) || buildMetaHubImageUrl("background", stremioId),
    logo: normalizeText(meta?.logo),
    description: normalizeText(meta?.description),
    releaseInfo: normalizeText(meta?.releaseInfo),
    genres: normalizeGenres(meta?.genres)
  };
}

export function getPosterFallback(stremioId) {
  return buildMetaHubImageUrl("poster", stremioId);
}

export function getBackgroundFallback(stremioId) {
  return buildMetaHubImageUrl("background", stremioId);
}

export async function resolveItemMetadata(stremioId, type) {
  if (metadataDisabled) {
    return toItemMetadata(null, stremioId);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`${metadataBaseUrl}/meta/${type}/${encodeURIComponent(stremioId)}.json`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return toItemMetadata(null, stremioId);
    }

    const payload = await response.json();
    return toItemMetadata(payload?.meta, stremioId);
  } catch {
    return toItemMetadata(null, stremioId);
  } finally {
    clearTimeout(timeout);
  }
}
