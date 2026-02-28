import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Menu, X, LogOut, Landmark } from 'lucide-react';

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Submissions', href: '/admin-dashboard', icon: LayoutDashboard },
        { name: 'Clients', href: '/admin/clients', icon: Users },
        { name: 'Bank Settings', href: '/admin/settings/bank', icon: Landmark },
    ];

    return (
        <div className="min-h-screen bg-secondary/30 flex font-body">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-card transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                    <Link to="/" className="font-heading font-bold text-xl text-primary flex items-center gap-2">
                        TGC Hub <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-wider">Admin</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <nav className="px-4 space-y-2">
                        {navigation.map((item) => {
                            // Exact match for dashboard, prefix match for others
                            const isActive = item.href === '/admin-dashboard'
                                ? location.pathname === item.href
                                : location.pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-border">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive text-sm font-medium transition-all group">
                        <LogOut className="w-5 h-5 group-hover:text-destructive transiton-colors" />
                        Exit Admin
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
                {/* Mobile header view */}
                <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-card border-b border-border shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-heading font-semibold text-lg text-foreground">Admin Portal</span>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background/50">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
