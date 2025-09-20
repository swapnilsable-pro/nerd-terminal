import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_SONGS, GET_QUEUE, QUEUE_SONG, UPVOTE_SONG, DOWNVOTE_SONG } from '../graphql/queries';
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
  DownvoteSongVariables
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

  // GraphQL hooks
  const { data: songsData, refetch: refetchSongs } = useQuery<GetSongsResponse>(GET_SONGS);
  const { data: queueData, refetch: refetchQueue } = useQuery<GetQueueResponse>(GET_QUEUE);
  const [queueSongMutation] = useMutation<QueueSongResponse, QueueSongVariables>(QUEUE_SONG);
  const [upvoteSongMutation] = useMutation<UpvoteSongResponse, UpvoteSongVariables>(UPVOTE_SONG);
  const [downvoteSongMutation] = useMutation<DownvoteSongResponse, DownvoteSongVariables>(DOWNVOTE_SONG);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addOutput = (text: string, type?: 'error' | 'success' | 'info') => {
    setOutput(prev => [...prev, { text, type }]);
  };

  const handleCommand = async (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to history and output
    setHistory(prev => [...prev, trimmedCommand]);
    addOutput(`$ ${trimmedCommand}`);

    const [cmd, ...args] = trimmedCommand.toLowerCase().split(' ');

    try {
      switch (cmd) {
        case 'help':
          addOutput('🎮 Available Commands:', 'info');
          addOutput('  help              - Show this help message');
          addOutput('  ls songs         - List all available songs');
          addOutput('  view queue       - Show current queue');
          addOutput('  queue <id>       - Add song to queue by ID');
          addOutput('  upvote <id>      - Upvote a song in queue');
          addOutput('  downvote <id>    - Downvote a song in queue');
          addOutput('  clear            - Clear terminal');
          addOutput('  whoami           - Show current user info');
          break;

        case 'ls':
          if (args[0] === 'songs') {
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
          } else {
            addOutput('❌ Unknown ls command. Try "ls songs"', 'error');
          }
          break;

        case 'view':
          if (args[0] === 'queue') {
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
            addOutput('❌ Unknown view command. Try "view queue"', 'error');
          }
          break;

        case 'queue':
          if (args.length === 0) {
            addOutput('❌ Please provide a song ID. Usage: queue <id>', 'error');
            break;
          }
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
          break;

        case 'upvote':
          if (args.length === 0) {
            addOutput('❌ Please provide a song ID. Usage: upvote <id>', 'error');
            break;
          }
          try {
            const result = await upvoteSongMutation({ variables: { songId: args[0] } });
            if (result.data?.upvoteSong) {
              const song = songsData?.songs?.find((s: Song) => s.id === args[0]);
              const songInfo = song ? `${song.title}` : `Song ID: ${args[0]}`;
              addOutput(`👍 Upvoted: ${songInfo}`, 'success');
              addOutput(`   Position: ${result.data.upvoteSong.position}, Votes: ${result.data.upvoteSong.votes}`);
              refetchQueue();
            }
          } catch (error) {
            addOutput(`❌ Error upvoting song: ${error}`, 'error');
          }
          break;

        case 'downvote':
          if (args.length === 0) {
            addOutput('❌ Please provide a song ID. Usage: downvote <id>', 'error');
            break;
          }
          try {
            const result = await downvoteSongMutation({ variables: { songId: args[0] } });
            if (result.data?.downvoteSong) {
              const song = songsData?.songs?.find((s: Song) => s.id === args[0]);
              const songInfo = song ? `${song.title}` : `Song ID: ${args[0]}`;
              addOutput(`👎 Downvoted: ${songInfo}`, 'success');
              addOutput(`   Position: ${result.data.downvoteSong.position}, Votes: ${result.data.downvoteSong.votes}`);
              refetchQueue();
            }
          } catch (error) {
            addOutput(`❌ Error downvoting song: ${error}`, 'error');
          }
          break;

        case 'clear':
          setOutput([
            { text: '🎧 Welcome to Nerdy Jukebox Terminal! 🎮', type: 'success' },
            { text: 'Type "help" to see available commands.', type: 'info' },
            { text: '' }
          ]);
          break;

        case 'whoami':
          addOutput('👤 User: anonymous nerd', 'info');
          addOutput('🎯 Role: jukebox enthusiast');
          addOutput('🚀 Status: ready to rock!');
          break;

        default:
          addOutput(`❌ Command not found: ${cmd}. Type "help" for available commands.`, 'error');
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
          Connected to GraphQL API: http://localhost:4000/
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
