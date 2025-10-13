import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Create a custom event name to broadcast connection status changes
export const CONNECTION_STATUS_EVENT = 'connectionStatusChange';

const mixerHttpUrl =
  process.env.REACT_APP_MIXER_HTTP_URL ??
  `${window.location.protocol}//${window.location.hostname}:4000/graphql`;

const mixerWsUrl =
  process.env.REACT_APP_MIXER_WS_URL ??
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:4000/graphql`;

const httpLink = new HttpLink({
  uri: mixerHttpUrl
});

const wsLink = new GraphQLWsLink(createClient({
  url: mixerWsUrl,
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
