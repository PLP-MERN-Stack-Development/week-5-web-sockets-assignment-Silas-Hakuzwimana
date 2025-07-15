import { useEffect, useState, useRef } from 'react';
import { Send, Users, MessageCircle, X, User, Menu, ChevronLeft, Paperclip } from 'lucide-react';
import { io } from 'socket.io-client';
import Footer from '../pages/Footer';

export default function Chat() {
    const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
    const [hasJoined, setHasJoined] = useState(false);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(true); // Auto-open sidebar on desktop
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);


    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);


    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_REACT_APP_SERVER_URL || 'http://localhost:5000', {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect_error', (err) => {
            console.error('Connection error:', err);
            setIsConnected(false);
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from server');
        });

        newSocket.on('user_list', (userList) => {
            setUsers(userList);
        });

        newSocket.on('user_joined', ({ username }) => {
            const systemMessage = {
                id: Date.now(),
                message: `${username} joined the chat`,
                timestamp: Date.now(),
                system: true,
            };
            setMessages((prev) => [...prev, systemMessage]);
        });

        newSocket.on('user_left', ({ username }) => {
            const systemMessage = {
                id: Date.now(),
                message: `${username} left the chat`,
                timestamp: Date.now(),
                system: true,
            };
            setMessages((prev) => [...prev, systemMessage]);
        });

        newSocket.on('receive_message', (messageData) => {
            const newMessage = {
                id: messageData.id,
                sender: messageData.sender,
                senderId: messageData.senderId,
                message: messageData.message,
                timestamp: new Date(messageData.timestamp).getTime(),
                isPrivate: messageData.isPrivate || false,
                isFile: messageData.isFile || false,
                filename: messageData.filename || '',
                status: 'delivered', // default on receiving
            };

            setMessages((prev) => [...prev, newMessage]);
            if (document.hidden && Notification.permission === 'granted') {
                const title = messageData.isPrivate ? `Private from ${messageData.sender}` : `${messageData.sender}`;
                const content = messageData.isFile ? `${messageData.filename}` : messageData.message;

                new Notification(title, {
                    body: content.length > 100 ? content.slice(0, 100) + '...' : content,
                    icon: '/chat-icon.png', // Optional: replace with your logo path
                });
            }

        });

        newSocket.on('private_message', (messageData) => {
            const newMessage = {
                id: messageData.id,
                sender: messageData.sender,
                senderId: messageData.senderId,
                message: messageData.message,
                timestamp: new Date(messageData.timestamp).getTime(),
                isPrivate: messageData.isPrivate || false,
                isFile: messageData.isFile || false,
                filename: messageData.filename || '',
                status: 'delivered', // default on receiving
            };

            setMessages((prev) => [...prev, newMessage]);
            if (document.hidden && Notification.permission === 'granted') {
                const title = messageData.isPrivate ? `Private from ${messageData.sender}` : `${messageData.sender}`;
                const content = messageData.isFile ? `${messageData.filename}` : messageData.message;

                new Notification(title, {
                    body: content.length > 100 ? content.slice(0, 100) + '...' : content,
                    icon: '/chat-icon.png', // Optional: replace with your logo path
                });
            }

        });

        newSocket.on('typing_users', (typingUserList) => {
            setTypingUsers(typingUserList.filter((user) => user !== username));
        });

        newSocket.on('message_status_update', ({ messageId, status }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId ? { ...msg, status } : msg
                )
            );
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [username]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });


    }, [messages]);

    useEffect(() => {
        if (isTyping && socket) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.emit('typing', false);
            }, 1000);

            return () => {
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            };
        }
    }, [isTyping, socket]);

    const handleJoin = () => {
        if (username.trim() && socket) {
            socket.emit('user_join', username.trim());
            localStorage.setItem('username', username.trim());
            setHasJoined(true);
        }
    };

    const handleSend = () => {
        if (!message.trim() || !socket) return;

        if (selectedUser) {
            socket.emit('private_message', {
                to: selectedUser.id,
                message: message.trim(),
            });
        } else {
            socket.emit('send_message', {
                message: message.trim(),
            });
        }

        setMessage('');
        setIsTyping(false);
        socket.emit('typing', false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !socket) return;

        const tempId = Date.now(); // Unique ID for temporary message
        const tempMessage = {
            id: tempId,
            sender: 'You',
            senderId: socket.id,
            message: 'Uploading...',
            timestamp: Date.now(),
            isFile: true,
            filename: file.name,
            uploading: true, // Custom flag
        };

        setMessages((prev) => [...prev, tempMessage]); // Show immediately

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_REACT_APP_SERVER_URL || 'http://localhost:5000'}/api/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();

            // Emit to other users
            socket.emit('send_message', {
                message: data.url,
                filename: file.name,
                isFile: true,
            });

            // Replace placeholder
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempId
                        ? {
                            ...msg,
                            message: data.url,
                            uploading: false,
                        }
                        : msg
                )
            );
        } catch (err) {
            console.error('Upload error', err);

            // Mark message as failed
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempId
                        ? {
                            ...msg,
                            message: 'Upload failed',
                            uploading: false,
                            failed: true,
                        }
                        : msg
                )
            );
        }
    };


    const handleTyping = (value) => {
        setMessage(value);

        if (socket && value.trim()) {
            if (!isTyping) {
                setIsTyping(true);
                socket.emit('typing', true);
            }
        } else if (isTyping) {
            setIsTyping(false);
            socket.emit('typing', false);
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getRandomColor = (username) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const isMyMessage = (senderId) => {
        return socket && senderId === socket.id;
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user.id === socket?.id ? null : user);
        if (isMobile) {
            setSidebarOpen(false); // Close sidebar on mobile after selection
        }
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Function to determine message width based on content length
    const getMessageWidth = (messageText, isFile = false) => {
        if (isFile) {
            return 'max-w-xs'; // Fixed width for files
        }

        const length = messageText.length;

        if (length <= 20) {
            return 'max-w-fit'; // Very short messages - only as wide as needed
        } else if (length <= 50) {
            return 'max-w-xs'; // Short messages
        } else if (length <= 100) {
            return 'max-w-sm'; // Medium messages
        } else if (length <= 200) {
            return 'max-w-md'; // Long messages
        } else if (length <= 300) {
            return 'max-w-lg'; // Very long messages
        } else {
            return 'max-w-xl'; // Extra long messages
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } fixed md:relative md:translate-x-0 left-0 top-0 h-full w-80 md:w-72 lg:w-80 z-50 md:z-auto transition-transform duration-300 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col overflow-hidden`}
            >
                <div className="p-4 md:p-6 border-b border-white/20 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold">ChatFlow</h2>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="md:hidden text-white/70 hover:text-white transition-colors p-1"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-3 md:p-4 flex-1 overflow-y-auto">
                    <div className="flex items-center space-x-2 mb-4 text-white/70">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Online Users ({users.length})</span>
                    </div>

                    <ul className="space-y-2">
                        {users.map((user) => (
                            <li
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className={`group cursor-pointer p-3 rounded-xl transition-all duration-200 ${selectedUser?.id === user.id
                                    ? 'bg-blue-500/20 border border-blue-400/30'
                                    : 'hover:bg-white/10 border border-transparent active:bg-white/20'
                                    }`}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUserSelect(user);
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${getRandomColor(user.username)}`}>
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium truncate">{user.username}</span>
                                            {user.id === socket?.id && (
                                                <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full flex-shrink-0">You</span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-1 mt-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-xs text-white/60">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {selectedUser && (
                    <div className="p-3 md:p-4 border-t border-white/20">
                        <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30 flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                                <User className="w-4 h-4 text-blue-300 flex-shrink-0" />
                                <span className="text-blue-300 text-sm truncate">Private Chat with {selectedUser.username}</span>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-blue-300 hover:text-white transition-colors flex-shrink-0 ml-2"
                                aria-label="Close private chat"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main chat area */}
            <main className="flex-1 flex flex-col min-w-0">
                {hasJoined ? (
                    <>
                        {/* Header */}
                        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 p-3 md:p-4 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center space-x-3 min-w-0">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="md:hidden text-white/70 hover:text-white transition-colors p-1"
                                    aria-label="Open sidebar"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                {selectedUser && isMobile && (
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="md:hidden text-white/70 hover:text-white transition-colors p-1"
                                        aria-label="Back to general chat"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <h1 className="text-lg md:text-xl font-semibold truncate">
                                    {selectedUser ? `${selectedUser.username}` : 'General Chat'}
                                </h1>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                <span className="text-white/70 text-xs md:text-sm hidden sm:inline">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
                                {messages.map((msg) =>
                                    msg.system ? (
                                        <div key={msg.id} className="flex items-center justify-center">
                                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 md:px-4 md:py-2 text-white/70 text-xs md:text-sm select-none">
                                                {msg.message}
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            key={msg.id}
                                            className={`flex items-start space-x-2 md:space-x-4 ${isMyMessage(msg.senderId) ? 'justify-end' : ''
                                                }`}
                                        >
                                            {!isMyMessage(msg.senderId) && (
                                                <div
                                                    className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm flex-shrink-0 ${getRandomColor(
                                                        msg.sender
                                                    )}`}
                                                >
                                                    {msg.sender[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className={`${getMessageWidth(msg.message, msg.isFile)} ${isMyMessage(msg.senderId) ? 'text-right' : ''}`}>
                                                <div className={`flex items-center space-x-2 mb-1 ${isMyMessage(msg.senderId) ? 'justify-end' : ''}`}>
                                                    <span className="font-semibold text-xs md:text-sm truncate">
                                                        {isMyMessage(msg.senderId) ? 'You' : msg.sender}
                                                    </span>
                                                    {msg.isPrivate && (
                                                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                                                            Private
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-white/50 flex-shrink-0">{formatTime(msg.timestamp)}</span>
                                                </div>
                                                <div
                                                    className={`${isMyMessage(msg.senderId) ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'
                                                        } rounded-lg p-2 md:p-3 whitespace-pre-wrap break-words text-sm md:text-base inline-block`}
                                                >
                                                    {msg.isFile ? (
                                                        msg.uploading ? (
                                                            <div className="italic text-white/60 flex items-center space-x-2">
                                                                <Paperclip className="w-4 h-4 animate-pulse" />
                                                                <span>Uploading {msg.filename}...</span>
                                                            </div>
                                                        ) : msg.failed ? (
                                                            <div className="text-red-400 italic">
                                                                Failed to upload {msg.filename}
                                                            </div>
                                                        ) : (
                                                            <a
                                                                href={msg.message}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="underline hover:text-blue-300 flex items-center space-x-1"
                                                                download={msg.filename}
                                                            >
                                                                <Paperclip className="w-4 h-4" />
                                                                <span className="truncate">{msg.filename}</span>
                                                            </a>
                                                        )
                                                    ) : (
                                                        msg.message
                                                    )}
                                                </div>
                                            </div>
                                            {isMyMessage(msg.senderId) && (
                                                <div
                                                    className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm flex-shrink-0 ${getRandomColor(
                                                        msg.sender
                                                    )}`}
                                                >
                                                    {msg.sender[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Typing indicator */}
                            {typingUsers.length > 0 && (
                                <div className="px-3 md:px-6 pb-2 text-white/70 text-xs md:text-sm select-none">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="truncate">{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                                    </div>
                                </div>
                            )}

                            {/* Input area */}
                            <div className="border-t border-white/20 p-3 md:p-4 bg-white/10 backdrop-blur-md flex-shrink-0">
                                {selectedUser && (
                                    <div className="mb-3 md:hidden">
                                        <div className="inline-flex items-center space-x-2 bg-blue-500/20 rounded-lg px-3 py-1 border border-blue-400/30 text-xs">
                                            <User className="w-3 h-3 text-blue-300" />
                                            <span className="text-blue-300">Private chat with {selectedUser.username}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2 md:space-x-4">
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer text-white/70 hover:text-white transition-colors p-1 flex-shrink-0"
                                        title="Upload a file"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                        <input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={!isConnected}
                                        />
                                    </label>

                                    <input
                                        type="text"
                                        placeholder={`Type your message${selectedUser ? ` to ${selectedUser.username}` : ''}...`}
                                        value={message}
                                        onChange={(e) => handleTyping(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        disabled={!isConnected}
                                        className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                    />

                                    <button
                                        onClick={handleSend}
                                        disabled={!message.trim() || !isConnected}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white p-2 md:p-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex-shrink-0"
                                        aria-label="Send message"
                                    >
                                        <Send className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-4 md:p-6">
                        <div className="max-w-md w-full">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20">
                                <div className="text-center mb-6 md:mb-8">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome to ChatFlow</h1>
                                    <p className="text-white/70 text-sm md:text-base">Enter your username to start chatting</p>
                                    <div className="flex items-center justify-center space-x-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                        <span className="text-white/50 text-xs md:text-sm">{isConnected ? 'Connected to server' : 'Connecting...'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-sm md:text-base text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        disabled={isConnected || !isConnected}
                                    />
                                    <button
                                        onClick={handleJoin}
                                        disabled={!username.trim() || !isConnected}
                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-semibold text-sm md:text-base transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                                    >
                                        {isConnected ? 'Join Chat' : 'Connecting...'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <Footer />
            </main>
        </div>
    );
}