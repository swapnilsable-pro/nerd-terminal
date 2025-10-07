import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
// Apollo hooks must be imported from the /react entry in this version
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { GET_SONGS, GET_QUEUE, QUEUE_SONG, UPVOTE_SONG, DOWNVOTE_SONG, QUEUE_UPDATED_SUBSCRIPTION } from '../graphql/queries';
import { CONNECTION_STATUS_EVENT } from '../apollo-client';
import { 
  Song, 
  QueueItem, 
  GetSongsResponse, 
  GetQueueResponse,
  QueueSongResponse,
  UpvoteSongResponse,
  DownvoteSongResponse,
  QueueSongVariables,
  UpvoteSongVariables,
  DownvoteSongVariables,
  QueueUpdatedSubscription
} from '../types';

// Styled components for terminal look
const TerminalContainer = styled.div`
  background: #1a1a1a;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  height: 100vh;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TerminalHeader = styled.div`
  color: #00ff00;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-weight: bold;
`;

const TerminalOutput = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  white-space: pre-wrap;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
`;

const Prompt = styled.span`
  color: #00ff00;
  margin-right: 5px;
`;

const TerminalInput = styled.input`
  background: transparent;
  border: none;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  flex: 1;
  outline: none;
  
  &::placeholder {
    color: #666;
  }
`;

const OutputLine = styled.div<{ type?: 'error' | 'success' | 'info' }>`
  margin: 2px 0;
  color: ${props => {
    switch (props.type) {
      case 'error': return '#ff6b6b';
      case 'success': return '#51cf66';
      case 'info': return '#74c0fc';
      default: return '#00ff00';
    }
  }};
`;

export const Terminal: React.FC = () => {
  const [input, setInput] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<{ text: string; type?: 'error' | 'success' | 'info' }[]>([
    { text: '🎧 Welcome to Nerdy Jukebox Terminal! 🎮', type: 'success' },
    { text: 'Type "help" to see available commands.', type: 'info' },
    { text: '' }
  ]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // State for live updates and connection status
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Effect to listen for connection status changes from the Apollo Client
  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isConnected: boolean }>;
      setIsConnected(customEvent.detail.isConnected);
    };

    window.addEventListener(CONNECTION_STATUS_EVENT, handleStatusChange);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener(CONNECTION_STATUS_EVENT, handleStatusChange);
    };
  }, []);

  // GraphQL hooks
  const { data: songsData, refetch: refetchSongs } = useQuery<GetSongsResponse>(GET_SONGS);
  const { data: queueData, refetch: refetchQueue } = useQuery<GetQueueResponse>(GET_QUEUE);
  const [queueSongMutation] = useMutation<QueueSongResponse, QueueSongVariables>(QUEUE_SONG);
  const [upvoteSongMutation] = useMutation<UpvoteSongResponse, UpvoteSongVariables>(UPVOTE_SONG);
  const [downvoteSongMutation] = useMutation<DownvoteSongResponse, DownvoteSongVariables>(DOWNVOTE_SONG);

  useSubscription<QueueUpdatedSubscription>(
    QUEUE_UPDATED_SUBSCRIPTION,
    {
      onData: ({ data }) => {
        const event = data.data?.queueUpdated;
        if (event) {
          console.log('📥 Subscription data received:', event);
          // Create a more descriptive message based on the event type
          const message = `🔔 Real-time update: ${event.type} (Song ID: ${event.songId})`;
          addOutput(message);
          // Refetch the queue to update the UI with the latest state
          refetchQueue();
        }
      },
      onError: (error) => {
        console.error('❌ Subscription error:', error);
        addOutput(`Error: Could not connect to real-time service. ${error.message}`, 'error');
      },
    }
  );

  const addOutput = (text: string | string[], type?: 'error' | 'success' | 'info') => {
    if (Array.isArray(text)) {
      const newOutputs = text.map(line => ({ text: line, type }));
      setOutput(prev => [...prev, ...newOutputs]);
    } else {
      setOutput(prev => [...prev, { text: text.toString(), type }]);
    }
  };

  const getSongInfo = (songId: string): string => {
    const song = songsData?.songs?.find((s: Song) => s.id === songId);
    return song ? `${song.title} - ${song.artist}` : `Song ID: ${songId}`;
  };

  const handleCommand = async (command: string) => {
    const trimmedCommand = command.trim();
    addOutput(`> ${trimmedCommand}`);

    const [cmd, ...args] = trimmedCommand.split(/\s+/);
    const arg = args.join(' ');

    try {
      switch (cmd) {
        case 'help':
          const helpText = [
            'NERDY JUKEBOX HELP',
            '------------------',
            'Available Commands:',
            '  songs              - List all available songs.',
            '  queue              - Show the current song queue.',
            '  queue <songId>     - Add a song to the queue.',
            '  upvote <songId>    - Upvote a song in the queue.',
            '  downvote <songId>  - Downvote a song in the queue.',
            '  live               - Manage real-time updates (on/off/status).',
            '  clear              - Clear the terminal screen.',
            '  help               - Display this help message.',
          ];
          addOutput(helpText);
          break;

        case 'songs':
          // Refetch and display songs
          await refetchSongs();
          if (songsData?.songs) {
            addOutput('🎵 Available Songs:', 'success');
            addOutput('');
            songsData.songs.forEach((song: Song, index: number) => {
              const duration = Math.floor(song.duration / 60) + ':' + (song.duration % 60).toString().padStart(2, '0');
              addOutput(`[${song.id}] ${song.title} - ${song.artist} (${duration})`);
            });
            addOutput(`\nTotal: ${songsData.songs.length} songs available`);
          } else {
            addOutput('❌ No songs available', 'error');
          }
          break;

        case 'queue':
          if (args.length === 0) {
            // Show current queue
            await refetchQueue();
            if (queueData?.queue && queueData.queue.length > 0) {
              addOutput('🎛️ Current Queue:', 'success');
              addOutput('');
              queueData.queue.forEach((item: QueueItem, index: number) => {
                const song = songsData?.songs?.find((s: Song) => s.id === item.songId);
                const songInfo = song ? `${song.title} - ${song.artist}` : `Song ID: ${item.songId}`;
                addOutput(`${item.position}. ${songInfo} (${item.votes} votes)`);
              });
              addOutput(`\nTotal: ${queueData.queue.length} songs in queue`);
            } else {
              addOutput('📭 Queue is empty', 'info');
            }
          } else {
            // Add song to queue
            const songId = args[0];
            try {
              const result = await queueSongMutation({ variables: { songId } });
              if (result.data?.queueSong) {
                const song = songsData?.songs?.find((s: Song) => s.id === songId);
                const songInfo = song ? `${song.title} - ${song.artist}` : `Song ID: ${songId}`;
                addOutput(`✅ Added to queue: ${songInfo}`, 'success');
                addOutput(`   Position: ${result.data.queueSong.position}, Votes: ${result.data.queueSong.votes}`);
                refetchQueue();
              }
            } catch (error) {
              addOutput(`❌ Error queueing song: ${error}`, 'error');
            }
          }
          break;

        case 'upvote':
          try {
            const result = await upvoteSongMutation({ variables: { songId: arg } });
            if (result.data?.upvoteSong) {
              const songInfo = getSongInfo(result.data.upvoteSong.songId);
              addOutput(`👍 Upvoted: ${songInfo}`, 'success');
            }
          } catch (error) {
            addOutput(`Error upvoting song: ${error instanceof Error ? error.message : String(error)}`, 'error');
          }
          break;

        case 'downvote':
          try {
            const result = await downvoteSongMutation({ variables: { songId: arg } });
            if (result.data?.downvoteSong) {
              const songInfo = getSongInfo(result.data.downvoteSong.songId);
              addOutput(`👎 Downvoted: ${songInfo}`, 'success');
            }
          } catch (error) {
            addOutput(`Error downvoting song: ${error instanceof Error ? error.message : String(error)}`, 'error');
          }
          break;

        case 'clear':
          setOutput([]);
          break;

        default:
          if (trimmedCommand) {
            addOutput(`❌ Command not found: ${cmd}. Type "help" for available commands.`, 'error');
          }
      }
    } catch (error) {
      addOutput(`❌ Error executing command: ${error}`, 'error');
    }

    addOutput(''); // Empty line for spacing
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    }
  };

  return (
    <TerminalContainer>
      <TerminalHeader>
        🎧 NERDY JUKEBOX v1.0 - Terminal Interface 🎮
        <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '5px', color: '#666' }}>
          <span>
            API Status: <span style={{ color: isConnected ? '#51cf66' : '#ff6b6b' }}>● {isConnected ? 'Connected' : 'Disconnected'}</span>
          </span>
          {isLiveMode && <span style={{ color: '#ff6b6b', marginLeft: '20px' }}>🔴 LIVE MODE</span>}
        </div>
      </TerminalHeader>
      
      <TerminalOutput ref={outputRef}>
        {output.map((line, index) => (
          <OutputLine key={index} type={line.type}>
            {line.text}
          </OutputLine>
        ))}
      </TerminalOutput>

      <InputContainer>
        <Prompt>$</Prompt>
        <TerminalInput
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a command... (try 'help')"
          autoFocus
        />
      </InputContainer>
    </TerminalContainer>
  );
};

export default Terminal;
