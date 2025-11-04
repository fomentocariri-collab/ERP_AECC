import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';
import { LOGO_BASE64 } from '../constants';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao fazer login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <img src={LOGO_BASE64} alt="Cariri Criativo Logo" className="mx-auto w-48 mb-4" />
                    <h2 className="text-xl text-gray-600 dark:text-gray-400">Bem-vindo(a) de volta!</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-gray-200 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-gray-200 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300 text-center">{error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                {loading ? (
                                    <Loader2 className="h-5 w-5 text-primary-300 animate-spin" />
                                ) : (
                                    <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                                )}
                            </span>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};