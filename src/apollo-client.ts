import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Create HTTP link to our unified GraphQL API (mixer-console)
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/',
});

// Create Apollo Client instance
export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
