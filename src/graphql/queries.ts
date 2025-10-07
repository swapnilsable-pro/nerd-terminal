import { gql } from '@apollo/client';

// Query to get all available songs
export const GET_SONGS = gql`
  query GetSongs {
    songs {
      id
      title
      artist
      duration
    }
  }
`;

// Query to get the current queue
export const GET_QUEUE = gql`
  query GetQueue {
    queue {
      songId
      position
      votes
      queuedAt
    }
  }
`;

// Mutation to queue a song
export const QUEUE_SONG = gql`
  mutation QueueSong($songId: String!) {
    queueSong(songId: $songId) {
      songId
      position
      votes
      queuedAt
    }
  }
`;

// Mutation to upvote a song
export const UPVOTE_SONG = gql`
  mutation UpvoteSong($songId: ID!) {
    upvoteSong(songId: $songId) {
      songId
      position
      votes
    }
  }
`;

// Mutation to downvote a song
export const DOWNVOTE_SONG = gql`
  mutation DownvoteSong($songId: ID!) {
    downvoteSong(songId: $songId) {
      songId
      position
      votes
    }
  }
`;

// Subscription for real-time queue updates
export const QUEUE_UPDATED_SUBSCRIPTION = gql`
  subscription QueueUpdated {
    queueUpdated {
      type
      songId
      user
      timestamp
    }
  }
`;
