
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { Home, Award, User as UserIcon, Sun, Moon, Star, Coins, Shield, Settings, Users, ShoppingBag, Swords } from 'lucide-react';

const ClayButton = ({ children, className, ...props }) =>
<button
  className={`
      px-4 py-2 rounded-2xl text-lg font-bold
      transition-all duration-200
      clay-button
      ${className}
    `}
  {...props}>

    {children}
  </button>;


export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in
      }};fetchUser();}, []);
  
  const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Leaderboard', icon: Award, page: 'Leaderboard' },
  { name: 'Friends', icon: Users, page: 'Friends' },
  { name: 'Teams', icon: Swords, page: 'TeamHub'},
  { name: 'Shop', icon: ShoppingBag, page: 'Shop' },
  { name: 'Profile', icon: UserIcon, page: 'Profile' }];


  const adminNav = { name: 'Admin', icon: Settings, page: 'Admin' };

  return (
    <div className="min-h-screen w-full clay-bg font-sans">
      <style>{`
        .clay-bg {
            background: linear-gradient(135deg, #f0f2f5 0%, #e6e8ed 100%);
        }
        .clay-card {
            background: #e9ecf2;
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 
                6px 6px 12px #d1d3d9,
                -6px -6px 12px #ffffff;
            border-radius: 24px;
            transition: all 0.3s ease;
        }
        .clay-card:hover {
            transform: translateY(-4px);
            box-shadow: 
                8px 8px 16px #d1d3d9,
                -8px -8px 16px #ffffff;
        }
        .clay-shadow-inset {
            box-shadow: 
                inset 5px 5px 10px #d1d3d9,
                inset -5px -5px 10px #ffffff;
        }
        .clay-button {
            background: #e9ecf2;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 
                4px 4px 8px #d1d3d9,
                -4px -4px 8px #ffffff;
            border-radius: 16px;
            color: #5a6782;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .clay-button:hover {
            transform: translateY(-2px);
             box-shadow: 
                6px 6px 12px #d1d3d9,
                -6px -6px 12px #ffffff;
        }
        .clay-button.active, .clay-button:active {
            transform: translateY(1px);
            background: #e9ecf2;
            box-shadow: 
                inset 4px 4px 8px #d1d3d9,
                inset -4px -4px 8px #ffffff;
        }
        .clay-nav {
            background: #e9ecf2;
            border-top: 1px solid rgba(255, 255, 255, 0.7);
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
        }
        .clay-progress {
            background: #e9ecf2;
            box-shadow: inset 2px 2px 5px #d1d3d9, inset -2px -2px 5px #ffffff;
        }
        .clay-progress-fill {
            background: linear-gradient(90deg, #8e96e0 0%, #5c67d2 100%);
            box-shadow: 0 2px 4px rgba(92, 103, 210, 0.4);
        }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>

      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-6 md:pb-6">
          {children}
        </main>
        
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:static clay-nav p-2">
            <div className="max-w-4xl mx-auto flex justify-between items-center h-16 px-2">
                <div className="hidden md:flex items-center gap-4">
                    <Link to={createPageUrl("Home")} className="clay-button px-4 py-2">
                        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Bible Quest</h1>
                    </Link>
                    {user &&
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 clay-button px-2 py-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold text-sm text-gray-700">{user.coins || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 clay-button px-2 py-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-bold text-sm text-gray-700">{user.stars || 0}</span>
                        </div>
                     </div>
                    }
                </div>

                <div className="flex-1 grid grid-cols-6 md:flex md:flex-1 md:justify-center gap-1">
                    {navItems.map((item) => {
                      const isActive = currentPageName === item.page;
                      return (
                        <Link to={createPageUrl(item.page)} key={item.name} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${isActive ? 'clay-button active' : 'hover:bg-white/60'}`}>
                                    <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                                    <span className={`hidden sm:block text-xs font-bold ${isActive ? 'text-purple-600' : 'text-gray-600'}`}>{item.name}</span>
                                </Link>);
                    })}
                </div>

                <div className="hidden md:flex items-center">
                    {user?.role === 'admin' &&
                <Link to={createPageUrl(adminNav.page)} key={adminNav.name} className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all duration-200 ${currentPageName === adminNav.page ? 'clay-button active' : 'hover:clay-button'}`}>
                            <adminNav.icon className={`w-5 h-5 ${currentPageName === adminNav.page ? 'text-purple-600' : 'text-gray-500'}`} />
                            <span className={`text-xs font-bold ${currentPageName === adminNav.page ? 'text-purple-600' : 'text-gray-600'}`}>{adminNav.name}</span>
                        </Link>
                    }
                </div>
            </div>
        </nav>
      </div>
    </div>
  );
}
