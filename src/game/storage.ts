import type { DifficultyMode } from '../types/DifficultyMode';

const BEST_SCORE_STORAGE_KEY = 'sunwing_best_scores_v1';
const MUTE_STORAGE_KEY = 'sunwing_muted_v1';

export function loadBestScores(): Record<DifficultyMode, number> {
  try {
    const raw = localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<DifficultyMode, number>>;
      return {
        breezy: Number(parsed.breezy) || 0,
        classic: Number(parsed.classic) || 0,
        turbo: Number(parsed.turbo) || 0,
      };
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }
  return { breezy: 0, classic: 0, turbo: 0 };
}

export function saveBestScores(scores: Record<DifficultyMode, number>): void {
  try {
    localStorage.setItem(BEST_SCORE_STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Ignore storage write errors
  }
}

export function loadMutePreference(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveMutePreference(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Ignore storage write errors
  }
}
