
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import TransactionsTable from './Component/TransactionsTable';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <h1>Transactions Dashboard</h1>

        <TransactionsTable />


      </BrowserRouter>
    </div>
  );
}

export default App;
