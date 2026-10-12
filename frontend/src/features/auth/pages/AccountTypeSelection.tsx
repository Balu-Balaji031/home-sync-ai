
import { Link } from 'react-router-dom';
import { User, Wrench } from 'lucide-react';

export default function AccountTypeSelection() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h1>
          <p className="text-gray-500">Choose the type of account you want to create.</p>
        </div>

        <div className="space-y-4">
          <Link 
            to="/register/customer"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <User size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Customer Account</h2>
              <p className="text-sm text-gray-500">Manage devices and create tickets</p>
            </div>
          </Link>

          <Link 
            to="/register/technician"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <Wrench size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Technician Account</h2>
              <p className="text-sm text-gray-500">Accept and resolve service tickets</p>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
