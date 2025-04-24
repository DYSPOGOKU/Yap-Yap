import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validatePhone, createUser, getUsers, generateToken } from '@/services/api';
import useStore from '@/store';
import toast from 'react-hot-toast';

const Auth = () => {
  const router = useRouter();
  const { setCurrentUser } = useStore();
  const [step, setStep] = useState('phone'); // 'phone', 'verify', 'profile'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // For demo purposes we'll skip actual phone verification
  // and just check if the phone number exists in the database
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phone.startsWith('+')) {
      setError('Phone number must start with country code (e.g., +1)');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await validatePhone(phone);
      
      if (response.data.exists) {
        // If user exists, fetch user data and log in
        const usersResponse = await getUsers();
        const user = usersResponse.data.find(user => user.phone === phone);
        
        if (user) {
          // Generate token for the user
          const tokenResponse = await generateToken(user.id);
          const { token } = tokenResponse.data;
          
          // Save token in localStorage
          localStorage.setItem('token', token);
          
          setCurrentUser(user);
          toast.success('Login successful!');
          
          // Redirect to the chat page with the token
          router.push(`/chat/${token}`);
        } else {
          // This shouldn't happen if the backend is consistent
          setStep('profile');
        }
      } else {
        // If user doesn't exist, proceed to create profile
        setStep('profile');
      }
    } catch (error) {
      console.error('Error validating phone:', error);
      setError('Failed to validate phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const userData = {
        name: name.trim(),
        phone,
        avatar
      };
      
      // Create the user
      const response = await createUser(userData);
      const newUser = response.data;
      
      // Generate token for the new user
      const tokenResponse = await generateToken(newUser.id);
      const { token } = tokenResponse.data;
      
      // Save token in localStorage
      localStorage.setItem('token', token);
      
      setCurrentUser(newUser);
      toast.success('Account created successfully!');
      
      // Redirect to the chat page with token
      router.push(`/chat/${token}`);
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-600">YapYap</h1>
          <p className="text-gray-600 mt-2">Connect with friends and family</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit}>
              <h2 className="text-xl font-semibold mb-6">Enter your phone number</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Include your country code (e.g., +1 for US)
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          )}
          
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <h2 className="text-xl font-semibold mb-6">Complete your profile</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Profile'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full mt-2 text-gray-600 py-2 hover:underline focus:outline-none text-sm"
              >
                Go back
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center text-gray-500 text-xs mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;