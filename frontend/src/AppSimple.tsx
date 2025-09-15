import { LoginFormSimple } from './components/auth/LoginFormSimple';
import { HeaderSimple } from './components/common/HeaderSimple';
import './App.css';

function App() {
  return (
    <div className="app">
      <HeaderSimple />
      <main className="main-content">
        <LoginFormSimple />
      </main>
    </div>
  );
}

export default App;