import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Create a custom event name to broadcast connection status changes
export const CONNECTION_STATUS_EVENT = 'connectionStatusChange';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  on: {
    connected: () => {
      console.log('✅ WS connected (graphql-ws)');
      window.dispatchEvent(new CustomEvent(CONNECTION_STATUS_EVENT, { detail: { isConnected: true } }));
    },
    closed: () => {
      console.log('🔌 WS closed');
      window.dispatchEvent(new CustomEvent(CONNECTION_STATUS_EVENT, { detail: { isConnected: false } }));
    },
    error: (err) => {
      console.error('💥 WS error', err);
      window.dispatchEvent(new CustomEvent(CONNECTION_STATUS_EVENT, { detail: { isConnected: false } }));
    }
  }
}));

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
export default client;