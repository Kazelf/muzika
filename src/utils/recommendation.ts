import { Song, ListenHistory, Recommendation } from '../types';

/**
 * Recommendation Engine cho Muzika
 * Giai đoạn 1: History-based + Trending
 * Giai đoạn 2: Content-based + Collaborative filtering (frontend)
 */

// === Content-based Filtering ===
// Tính điểm similarity giữa 2 bài hát dựa trên genre, mood, artist
function contentSimilarity(songA: Song, songB: Song): number {
  let score = 0;
  if (songA.genre === songB.genre) score += 0.5;
  if (songA.mood === songB.mood) score += 0.3;
  if (songA.artistId === songB.artistId) score += 0.2;
  if (Math.abs(songA.year - songB.year) <= 2) score += 0.1;
  return Math.min(score, 1);
}

// === Collaborative Filtering (simplified) ===
// Dựa trên lịch sử nghe để tìm pattern
function buildUserProfile(history: ListenHistory[], songs: Song[]): Map<string, number> {
  const songMap = new Map(songs.map(s => [s.id, s]));
  const profile = new Map<string, number>();

  // Đếm số lần nghe theo genre và mood
  history.forEach(h => {
    const song = songMap.get(h.songId);
    if (!song) return;
    const genreKey = `genre:${song.genre}`;
    const moodKey = `mood:${song.mood}`;
    profile.set(genreKey, (profile.get(genreKey) || 0) + 1);
    profile.set(moodKey, (profile.get(moodKey) || 0) + 1);
  });

  return profile;
}

// === Main Recommendation Function ===
export function getRecommendations(
  history: ListenHistory[],
  allSongs: Song[],
  likedSongIds: string[],
  limit = 10
): Recommendation[] {
  if (allSongs.length === 0) return [];

  const listenedIds = new Set(history.map(h => h.songId));
  const userProfile = buildUserProfile(history, allSongs);
  const recentSongs = history
    .slice(0, 10)
    .map(h => allSongs.find(s => s.id === h.songId))
    .filter(Boolean) as Song[];

  const scored = allSongs
    .filter(song => !listenedIds.has(song.id)) // Exclude already heard
    .map(song => {
      let score = 0;
      let reason = '';

      // 1. Trending bonus
      if (song.trending) {
        score += 0.15;
        reason = 'Đang thịnh hành';
      }

      // 2. Popularity score (normalized 0-0.15)
      const maxPlays = Math.max(...allSongs.map(s => s.playCount));
      score += (song.playCount / maxPlays) * 0.15;

      // 3. Content-based: similarity to recently played
      if (recentSongs.length > 0) {
        const avgSimilarity = recentSongs.reduce((sum, ref) =>
          sum + contentSimilarity(song, ref), 0) / recentSongs.length;
        score += avgSimilarity * 0.4;
        if (avgSimilarity > 0.5) reason = 'Vì bạn thích nghe nhạc tương tự';
      }

      // 4. User profile match (genre/mood preference)
      const genreScore = userProfile.get(`genre:${song.genre}`) || 0;
      const moodScore = userProfile.get(`mood:${song.mood}`) || 0;
      const maxGenre = Math.max(...Array.from(userProfile.values()), 1);
      score += (genreScore / maxGenre) * 0.2;
      score += (moodScore / maxGenre) * 0.1;

      if (genreScore > 0 && !reason) reason = `Dựa trên sở thích ${song.genre} của bạn`;
      if (!reason) reason = 'Được gợi ý cho bạn';

      return { song, score, reason };
    });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// === Mood-based Recommendation ===
export function getMoodRecommendations(
  mood: string,
  allSongs: Song[],
  limit = 6
): Recommendation[] {
  return allSongs
    .filter(s => s.mood === mood)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit)
    .map(song => ({
      song,
      score: 1,
      reason: `Phù hợp với tâm trạng ${getMoodLabel(mood)}`,
    }));
}

// === Auto Playlist Generation ===
export function generateAutoPlaylist(
  type: 'weekly' | 'mood',
  history: ListenHistory[],
  allSongs: Song[],
  mood?: string
): Song[] {
  if (type === 'weekly') {
    // Top 10 bài nghe nhiều nhất trong tuần
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekHistory = history.filter(h => new Date(h.playedAt) >= weekAgo);
    const countMap = new Map<string, number>();
    weekHistory.forEach(h => countMap.set(h.songId, (countMap.get(h.songId) || 0) + 1));
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => allSongs.find(s => s.id === id))
      .filter(Boolean) as Song[];
  }

  if (type === 'mood' && mood) {
    return allSongs.filter(s => s.mood === mood).slice(0, 10);
  }

  return [];
}

export function getMoodLabel(mood: string): string {
  const labels: Record<string, string> = {
    calm: 'Thư Giãn',
    energetic: 'Năng Động',
    happy: 'Vui Vẻ',
    sad: 'Buồn Bã',
    romantic: 'Lãng Mạn',
  };
  return labels[mood] || mood;
}

export function getMoodEmoji(mood: string): string {
  const emojis: Record<string, string> = {
    calm: '🌊',
    energetic: '⚡',
    happy: '☀️',
    sad: '🌧️',
    romantic: '🌹',
  };
  return emojis[mood] || '🎵';
}
