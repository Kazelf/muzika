import api from './api';
import { Song, Artist, Album, Playlist, SearchResults } from '../types';

export const songsService = {
  getAll: () => api.get<Song[]>('/songs'),
  getById: (id: string) => api.get<Song>(`/songs/${id}`),
  getTrending: () => api.get<Song[]>('/songs?trending=true&_sort=playCount&_order=desc&_limit=10'),
  getByGenre: (genre: string) => api.get<Song[]>(`/songs?genre=${genre}`),
  getByMood: (mood: string) => api.get<Song[]>(`/songs?mood=${mood}`),
  incrementPlay: (id: string, currentCount: number) =>
    api.patch(`/songs/${id}`, { playCount: currentCount + 1 }),
};

export const artistsService = {
  getAll: () => api.get<Artist[]>('/artists'),
  getById: (id: string) => api.get<Artist>(`/artists/${id}`),
};

export const albumsService = {
  getAll: () => api.get<Album[]>('/albums'),
  getById: (id: string) => api.get<Album>(`/albums/${id}`),
};

export const playlistsService = {
  getAll: () => api.get<Playlist[]>('/playlists'),
  getById: (id: string) => api.get<Playlist>(`/playlists/${id}`),
  getByUser: (userId: string) => api.get<Playlist[]>(`/playlists?userId=${userId}`),
  getPublic: () => api.get<Playlist[]>('/playlists?isPublic=true'),
  create: (data: Playlist) => api.post<Playlist>('/playlists', data),
  update: (id: string, data: Partial<Playlist>) => api.patch<Playlist>(`/playlists/${id}`, data),
  delete: (id: string) => api.delete(`/playlists/${id}`),
  addSong: (id: string, songId: string, songIds: string[]) =>
    api.patch<Playlist>(`/playlists/${id}`, { songIds: [...songIds, songId] }),
  removeSong: (id: string, songId: string, songIds: string[]) =>
    api.patch<Playlist>(`/playlists/${id}`, { songIds: songIds.filter(s => s !== songId) }),
};

export const historyService = {
  getByUser: (userId: string) =>
    api.get(`/listenHistory?userId=${userId}&_sort=playedAt&_order=desc`),
  add: (data: { userId: string; songId: string; playedAt: string; duration: number }) =>
    api.post('/listenHistory', { ...data, id: `h${Date.now()}` }),
};

export const likesService = {
  getByUser: (userId: string) => api.get(`/likes?userId=${userId}`),
  add: (userId: string, songId: string) =>
    api.post('/likes', { id: `l${Date.now()}`, userId, songId }),
  remove: (likeId: string) => api.delete(`/likes/${likeId}`),
  check: (userId: string, songId: string) =>
    api.get(`/likes?userId=${userId}&songId=${songId}`),
};

export const usersService = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  follow: (myId: string, targetId: string, myFollowing: string[], targetFollowers: string[]) =>
    Promise.all([
      api.patch(`/users/${myId}`, { following: [...myFollowing, targetId] }),
      api.patch(`/users/${targetId}`, { followers: [...targetFollowers, myId] }),
    ]),
  unfollow: (myId: string, targetId: string, myFollowing: string[], targetFollowers: string[]) =>
    Promise.all([
      api.patch(`/users/${myId}`, { following: myFollowing.filter(id => id !== targetId) }),
      api.patch(`/users/${targetId}`, { followers: targetFollowers.filter(id => id !== myId) }),
    ]),
};

// Fuzzy search utility
export const searchService = {
  search: async (query: string): Promise<SearchResults> => {
    const [songs, artists, albums, playlists] = await Promise.all([
      api.get<Song[]>('/songs'),
      api.get<Artist[]>('/artists'),
      api.get<Album[]>('/albums'),
      api.get<Playlist[]>('/playlists?isPublic=true'),
    ]);

    const q = query.toLowerCase();
    const fuzzyMatch = (text: string) => {
      const t = text.toLowerCase();
      if (t.includes(q)) return true;
      // Simple fuzzy: check if all chars of q appear in order in t
      let qi = 0;
      for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
      }
      return qi === q.length;
    };

    return {
      songs: songs.data.filter(s =>
        fuzzyMatch(s.title) || fuzzyMatch(s.artist) || fuzzyMatch(s.genre)
      ),
      artists: artists.data.filter(a => fuzzyMatch(a.name)),
      albums: albums.data.filter(a => fuzzyMatch(a.title)),
      playlists: playlists.data.filter(p => fuzzyMatch(p.title)),
    };
  },
};
