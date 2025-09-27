import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { Terminal } from './components/Terminal';
import './App.css';
import client from './apollo-client'; // Use the split HTTP/WS client

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <Terminal />
      </div>
    </ApolloProvider>
  );
}

export default App;
