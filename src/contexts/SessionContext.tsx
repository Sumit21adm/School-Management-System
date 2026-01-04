
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionService } from '@/lib/api';

interface SessionContextType {
    selectedSessionId: number | null;
    selectedSessionName: string | null;
    setSession: (id: number, name: string) => void;
    isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
    selectedSessionId: null,
    selectedSessionName: null,
    setSession: () => { },
    isLoading: true,
});

export const useSessionContext = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [selectedSessionName, setSelectedSessionName] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch sessions to determine default if needed
    const { data: sessionsData, isLoading: isSessionsLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => sessionService.getAll(true),
        staleTime: 5 * 60 * 1000,
        enabled: typeof window !== 'undefined' && !!localStorage.getItem('authToken'),
    });

    useEffect(() => {
        if (isSessionsLoading || !sessionsData) return;

        // sessionsData is the array of sessions
        const sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData as any).sessions || [];

        if (sessions.length === 0) return;

        const storedId = localStorage.getItem('selectedSessionId');
        const storedName = localStorage.getItem('selectedSessionName');

        if (storedId && storedName) {
            // Verify if stored session still exists in the fetched list
            const exists = sessions.find((s: any) => s.id === Number(storedId));
            if (exists) {
                if (selectedSessionId !== Number(storedId)) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setSelectedSessionId(Number(storedId));
                    setSelectedSessionName(storedName);
                }
            } else {
                // Fallback to active session
                const active = sessions.find((s: any) => s.isActive);
                if (active && selectedSessionId !== active.id) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setSelectedSessionId(active.id);
                    setSelectedSessionName(active.name);
                }
            }
        } else {
            // Default to active session
            const active = sessions.find((s: any) => s.isActive);
            if (active && selectedSessionId !== active.id) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedSessionId(active.id);
                setSelectedSessionName(active.name);
            }
        }
        if (!isInitialized) {
            setIsInitialized(true);
        }
    }, [sessionsData, isSessionsLoading, selectedSessionId, isInitialized]);

    const setSession = (id: number, name: string) => {
        setSelectedSessionId(id);
        setSelectedSessionName(name);
        localStorage.setItem('selectedSessionId', String(id));
        localStorage.setItem('selectedSessionName', name);
    };

    return (
        <SessionContext.Provider value={{
            selectedSessionId,
            selectedSessionName,
            setSession,
            isLoading: !isInitialized && isSessionsLoading
        }}>
            {children}
        </SessionContext.Provider>
    );
};
