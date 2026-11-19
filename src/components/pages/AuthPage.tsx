import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

type AuthMode = 'login' | 'register-customer' | 'register-farmer';

interface AuthPageProps {
  initialMode?: AuthMode;
  onSuccess: () => void;
}

const INDIAN_STATES = ['Karnataka', 'Tamil Nadu', 'Maharashtra', 'Andhra Pradesh', 'Kerala'];
const KARNATAKA_DISTRICTS = ['Bengaluru', 'Mysuru', 'Mandya', 'Ramanagara', 'Kolar', 'Tumakuru'];

export function AuthPage({ initialMode = 'login', onSuccess }: AuthPageProps) {
  const { login, registerCustomer, registerFarmer } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Customer register state
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('+91 ');
  const [custPassword, setCustPassword] = useState('');
  const [custDistrict, setCustDistrict] = useState('Bengaluru');

  // Farmer register state
  const [farmFullName, setFarmFullName] = useState('');
  const [farmPhone, setFarmPhone] = useState('+91 ');
  const [farmEmail, setFarmEmail] = useState('');
  const [farmPassword, setFarmPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmDistrict, setFarmDistrict] = useState('Kolar');
  const [farmState, setFarmState] = useState('Karnataka');
  const [cropTypes, setCropTypes] = useState('');
  const [farmingMethod, setFarmingMethod] = useState<'Organic' | 'Conventional'>('Organic');
  const [farmDescription, setFarmDescription] = useState('');
  const [profileImage, setProfileImage] = useState(
    '/src/assets/images/farmer_portrait_ramesh_1795104333655.jpg'
  );
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (email: string) => {
    setError('');
    setLoginEmail(email);
    setLoginPassword('Krishi@123');
    setSubmitting(true);
    try {
      await login(email, 'Krishi@123');
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerCustomer({
        fullName: custName,
        email: custEmail,
        phone: custPhone,
        password: custPassword,
        preferredDistrict: custDistrict,
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFarmerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerFarmer({
        fullName: farmFullName,
        phone: farmPhone,
        email: farmEmail,
        password: farmPassword,
        farmName,
        farmLocation,
        district: farmDistrict,
        state: farmState,
        cropTypes,
        farmingMethod,
        farmDescription,
        profileImage,
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = String(reader.result || '');
      try {
        // Store data URI directly on unauthenticated registration; cloudinary helper handles authenticated uploads
        setProfileImage(dataUri);
      } finally {
        setUploadingImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-[#1F2B23]/10 overflow-hidden shadow-sm">
        {/* Segmented Auth Mode Switch */}
        <div className="p-4 sm:p-6 bg-[#FBFAF5] border-b border-[#1F2B23]/10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[#1F6B45] text-white'
                : 'bg-white border border-[#1F2B23]/15 text-[#1F2B23]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register-customer');
              setError('');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'register-customer'
                ? 'bg-[#1F6B45] text-white'
                : 'bg-white border border-[#1F2B23]/15 text-[#1F2B23]'
            }`}
          >
            Customer Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register-farmer');
              setError('');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'register-farmer'
                ? 'bg-[#1F6B45] text-white'
                : 'bg-white border border-[#1F2B23]/15 text-[#1F2B23]'
            }`}
          >
            Farmer Registration
          </button>
        </div>

        <div className="p-6 sm:p-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <form onSubmit={handleLogin} className="md:col-span-7 space-y-5">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2B23]">
                    Welcome Back
                  </h1>
                  <p className="text-sm text-[#1F2B23]/70 mt-1">
                    Sign in as a Customer, Farmer, or Administrator to manage your marketplace
                    activity.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.in"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm focus:outline-none focus:border-[#1F6B45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm focus:outline-none focus:border-[#1F6B45]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Signing in...' : 'Sign In to Krishi Market'}
                </button>
              </form>

              <div className="md:col-span-5 bg-[#FBFAF5] rounded-2xl border border-[#1F2B23]/10 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[#1F2B23]">Demo Accounts</h2>
                <p className="text-xs text-[#1F2B23]/65 leading-relaxed">
                  Explore any role immediately with pre-seeded Indian farm data (password:{' '}
                  <code className="font-mono">Krishi@123</code>):
                </p>
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemoLogin('ananya@krishimarket.in')}
                    className="w-full text-left p-3 rounded-xl bg-white border border-[#1F2B23]/10 hover:border-[#1F6B45] transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-[#1F6B45]">Customer Account</div>
                    <div className="text-xs text-[#1F2B23]/75 mt-0.5">
                      Ananya Sharma · ananya@krishimarket.in
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemoLogin('ramesh@krishimarket.in')}
                    className="w-full text-left p-3 rounded-xl bg-white border border-[#1F2B23]/10 hover:border-[#1F6B45] transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-[#1F6B45]">Farmer Account</div>
                    <div className="text-xs text-[#1F2B23]/75 mt-0.5">
                      Ramesh Gowda · Nandi Valley Organic Farm
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemoLogin('admin@krishimarket.in')}
                    className="w-full text-left p-3 rounded-xl bg-white border border-[#1F2B23]/10 hover:border-[#1F6B45] transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-[#E58B42]">Admin Account</div>
                    <div className="text-xs text-[#1F2B23]/75 mt-0.5">
                      Arvind Deshmukh · Platform Operations
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'register-customer' && (
            <form onSubmit={handleCustomerRegister} className="max-w-xl space-y-5">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2B23]">
                  Create Customer Account
                </h1>
                <p className="text-sm text-[#1F2B23]/70 mt-1">
                  Order morning-harvested produce directly from verified farms.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Priya Nair"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Indian Mobile (+91)
                  </label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+91 98450 00000"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="priya@example.in"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Preferred Delivery City
                  </label>
                  <select
                    value={custDistrict}
                    onChange={(e) => setCustDistrict(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  >
                    {KARNATAKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={custPassword}
                  onChange={(e) => setCustPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 h-11 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Creating Account...' : 'Create Customer Account'}
              </button>
            </form>
          )}

          {mode === 'register-farmer' && (
            <form onSubmit={handleFarmerRegister} className="space-y-5">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2B23]">
                  Farmer Partner Registration
                </h1>
                <p className="text-sm text-[#1F2B23]/70 mt-1">
                  List your harvest directly to households. New farms enter verification review
                  immediately upon submission.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={farmFullName}
                    onChange={(e) => setFarmFullName(e.target.value)}
                    placeholder="Manjunath Gowda"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Phone Number (+91)
                  </label>
                  <input
                    type="tel"
                    required
                    value={farmPhone}
                    onChange={(e) => setFarmPhone(e.target.value)}
                    placeholder="+91 98451 00000"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={farmEmail}
                    onChange={(e) => setFarmEmail(e.target.value)}
                    placeholder="manjunath@farm.in"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={farmPassword}
                    onChange={(e) => setFarmPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Green Valley Agro Farm"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Village / Farm Location
                  </label>
                  <input
                    type="text"
                    required
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    placeholder="Malur Road, Kolar"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    District
                  </label>
                  <select
                    value={farmDistrict}
                    onChange={(e) => setFarmDistrict(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  >
                    {KARNATAKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    State
                  </label>
                  <select
                    value={farmState}
                    onChange={(e) => setFarmState(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Farming Method
                  </label>
                  <select
                    value={farmingMethod}
                    onChange={(e) =>
                      setFarmingMethod(e.target.value as 'Organic' | 'Conventional')
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  >
                    <option value="Organic">Organic</option>
                    <option value="Conventional">Conventional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Crop Types (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={cropTypes}
                    onChange={(e) => setCropTypes(e.target.value)}
                    placeholder="Tomatoes, Spinach, Ragi, Mangoes"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                    Farmer Profile Photo
                  </label>
                  <label className="h-11 px-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm flex items-center gap-2 cursor-pointer hover:border-[#1F6B45]">
                    <Upload className="w-4 h-4 text-[#1F6B45]" />
                    <span className="truncate">
                      {uploadingImg ? 'Reading image...' : 'Upload Portrait (optional)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2B23]/80 mb-1.5">
                  Farm Description & Cultivation Practices
                </label>
                <textarea
                  rows={3}
                  required
                  value={farmDescription}
                  onChange={(e) => setFarmDescription(e.target.value)}
                  placeholder="Share your soil practices, harvest timing, and crop specialties..."
                  className="w-full p-3.5 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <span className="text-xs text-[#1F2B23]/65 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1F6B45]" />
                  Note: Farmer accounts can list produce immediately while awaiting admin badge approval.
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 h-11 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Submitting Registration...' : 'Register Farm'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
