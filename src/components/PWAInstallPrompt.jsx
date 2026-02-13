import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can add to home screen
            setIsVisible(true);
        });

        // Hide if already installed
        window.addEventListener('appinstalled', () => {
            setIsVisible(false);
            setDeferredPrompt(null);
        });

        // For iOS, show the prompt manually if not already in standalone mode
        if (isIOSDevice && !window.navigator.standalone) {
            // Show prompt after a small delay
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-slide-up">
            <div className={`relative p-5 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${theme === 'dark'
                    ? 'bg-gray-900/80 border-gray-800 text-white'
                    : 'bg-white/80 border-gray-200 text-gray-900'
                }`}>
                {/* Background Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none ${theme === 'dark' ? 'bg-neon-cyan' : 'bg-blue-500'
                    }`}></div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-neon-cyan/10' : 'bg-blue-50'
                            }`}>
                            <Download size={24} className={theme === 'dark' ? 'text-neon-cyan' : 'text-blue-600'} />
                        </div>
                        <div>
                            <h4 className="font-heading font-bold text-lg leading-tight">Install App</h4>
                            <p className={`font-body text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                Get a better experience with our app
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-black/5 text-gray-600'
                            }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-5">
                    {isIOS ? (
                        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-black/40 border-gray-800' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <p className="font-body text-sm flex items-center gap-2">
                                1. Tap <Share size={16} className="text-blue-500" /> in the menu
                            </p>
                            <p className="font-body text-sm flex items-center gap-2">
                                2. Tap <PlusSquare size={16} /> "Add to Home Screen"
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className={`w-full py-3 rounded-xl font-body font-bold transition-all ${theme === 'dark'
                                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:shadow-neon'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                                }`}
                        >
                            Install Now
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .glass-effect {
                    backdrop-filter: blur(12px) saturate(180%);
                    -webkit-backdrop-filter: blur(12px) saturate(180%);
                }
            `}</style>
        </div>
    );
};

export default PWAInstallPrompt;
