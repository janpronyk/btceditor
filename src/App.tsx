import React from 'react';
import styled from 'styled-components';
import './App.css';
import { Editor } from './components/editor/editor';

const AppContainer = styled.main`  
  min-height: 100%;
  max-width: 960px;
  margin: auto;
`

function App() {
  return (
    <AppContainer>
      <Editor />
    </AppContainer>
  );
}

export default App;
