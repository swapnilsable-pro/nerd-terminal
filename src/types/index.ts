// GraphQL Query/Mutation Response Types
export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
}

export interface QueueItem {
  songId: string;
  position: number;
  votes: number;
  queuedAt?: string;
}

export interface GetSongsResponse {
  songs: Song[];
}

export interface GetQueueResponse {
  queue: QueueItem[];
}

export interface QueueSongResponse {
  queueSong: QueueItem;
}

export interface UpvoteSongResponse {
  upvoteSong: QueueItem;
}

export interface DownvoteSongResponse {
  downvoteSong: QueueItem;
}

export interface QueueSongVariables {
  songId: string;
}

export interface UpvoteSongVariables {
  songId: string;
}

export interface DownvoteSongVariables {
  songId: string;
}

// Subscription Types
export interface QueueUpdateEvent {
  type: string;
  queue: QueueItem[];
  timestamp: string;
  user?: string;
  songId?: string;
}

export interface QueueUpdatedSubscription {
  queueUpdated: QueueUpdateEvent;
}
