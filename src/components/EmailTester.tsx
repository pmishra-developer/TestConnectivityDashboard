import { useState } from 'react';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

type EmailProvider = 'smtp' | 'ses';

interface SmtpFormData {
  provider: 'smtp';
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

interface SesFormData {
  provider: 'ses';
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

type EmailFormData = SmtpFormData | SesFormData;

export default function EmailTester() {
  const [provider, setProvider] = useState<EmailProvider>('smtp');
  const [formData, setFormData] = useState<EmailFormData>({
    provider: 'smtp',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    from: '',
    to: '',
    subject: 'Test Email',
    body: 'This is a test email sent from the testing dashboard.',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleProviderChange = (newProvider: EmailProvider) => {
    setProvider(newProvider);
    if (newProvider === 'smtp') {
      setFormData({
        provider: 'smtp',
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',
        from: '',
        to: '',
        subject: 'Test Email',
        body: 'This is a test email sent from the testing dashboard.',
      });
    } else {
      setFormData({
        provider: 'ses',
        awsAccessKeyId: '',
        awsSecretAccessKey: '',
        awsRegion: 'us-east-1',
        from: '',
        to: '',
        subject: 'Test Email',
        body: 'This is a test email sent from the testing dashboard.',
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const endpoint = provider === 'smtp' ? 'send-email' : 'send-email-ses';
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Email sent successfully!' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">
        Email Delivery Test
      </h2>

      <div className="mb-6 flex gap-4">
        <button
          type="button"
          onClick={() => handleProviderChange('smtp')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
            provider === 'smtp'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          SMTP
        </button>
        <button
          type="button"
          onClick={() => handleProviderChange('ses')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
            provider === 'ses'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Amazon SES
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {provider === 'smtp' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SMTP Hostname
                </label>
                <input
                  type="text"
                  name="smtpHost"
                  value={(formData as SmtpFormData).smtpHost}
                  onChange={handleChange}
                  placeholder="smtp.example.com"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="text"
                  name="smtpPort"
                  value={(formData as SmtpFormData).smtpPort}
                  onChange={handleChange}
                  placeholder="587"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  name="smtpUser"
                  value={(formData as SmtpFormData).smtpUser}
                  onChange={handleChange}
                  placeholder="username"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  name="smtpPassword"
                  value={(formData as SmtpFormData).smtpPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  name="awsAccessKeyId"
                  value={(formData as SesFormData).awsAccessKeyId}
                  onChange={handleChange}
                  placeholder="AKIA..."
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  name="awsSecretAccessKey"
                  value={(formData as SesFormData).awsSecretAccessKey}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AWS Region
                </label>
                <select
                  name="awsRegion"
                  value={(formData as SesFormData).awsRegion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              From
            </label>
            <input
              type="email"
              name="from"
              value={formData.from}
              onChange={handleChange}
              placeholder="sender@example.com"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              To
            </label>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleChange}
              placeholder="recipient@example.com"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Email subject"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Message Body
          </label>
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            placeholder="Email content"
            rows={4}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Test Email
            </>
          )}
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3
                className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success ? 'Success' : 'Error'}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
