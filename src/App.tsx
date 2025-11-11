import { useState } from 'react';
import { Mail, Database } from 'lucide-react';
import EmailTester from './components/EmailTester';
import DatabaseTester from './components/DatabaseTester';

function App() {
  const [activeTab, setActiveTab] = useState<'email' | 'database'>('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Testing Dashboard
            </h1>
            <p className="text-slate-600">
              Test email delivery and database connections
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'email'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-5 h-5" />
                Email Testing
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'database'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Database className="w-5 h-5" />
                Database Testing
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'email' ? <EmailTester /> : <DatabaseTester />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
