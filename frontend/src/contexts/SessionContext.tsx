import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../lib/api';


interface AcademicSession {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isSetupMode: boolean;
    createdAt: string;
    updatedAt: string;
}

interface SessionContextType {
    activeSession: AcademicSession | null;
    selectedSession: AcademicSession | null;
    currentSession: AcademicSession | null; // Alias for selectedSession
    allSessions: AcademicSession[];
    isLoading: boolean;
    switchSession: (sessionId: number) => void;
    refreshSessions: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(() => {
        // Load from localStorage
        const saved = localStorage.getItem('selectedSessionId');
        return saved ? parseInt(saved) : null;
    });

    // Fetch all sessions
    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => sessionService.getAll(true),
        staleTime: 60000, // 1 minute
    });

    const allSessions: AcademicSession[] = sessionsData?.sessions || [];
    const activeSession = allSessions.find(s => s.isActive) || null;

    // Selected session (defaults to active session)
    const selectedSession = selectedSessionId
        ? allSessions.find(s => s.id === selectedSessionId) || activeSession
        : activeSession;

    const currentSession = selectedSession;

    // Update selected session when sessions load or when active session changes
    useEffect(() => {
        if (allSessions.length === 0) return; // Wait for sessions to load

        const savedId = localStorage.getItem('selectedSessionId');

        // Case 1: No saved session - default to active session
        if (!savedId && activeSession) {
            setSelectedSessionId(activeSession.id);
            localStorage.setItem('selectedSessionId', activeSession.id.toString());
            return;
        }

        // Case 2: Saved session ID exists - verify it's still valid
        if (savedId) {
            const savedIdNum = parseInt(savedId);
            const savedSession = allSessions.find(s => s.id === savedIdNum);

            if (!savedSession) {
                // Session was deleted - switch to active session
                if (activeSession) {
                    setSelectedSessionId(activeSession.id);
                    localStorage.setItem('selectedSessionId', activeSession.id.toString());
                }
            } else if (selectedSessionId !== savedIdNum) {
                // Sync state with localStorage
                setSelectedSessionId(savedIdNum);
            }
        }
    }, [activeSession, allSessions, selectedSessionId]);

    const switchSession = (sessionId: number) => {
        setSelectedSessionId(sessionId);
        localStorage.setItem('selectedSessionId', sessionId.toString());
        // Invalidate all queries that depend on session
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['admissions'] });
        queryClient.invalidateQueries({ queryKey: ['feeTransactions'] });
    };

    const refreshSessions = () => {
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
    };

    return (
        <SessionContext.Provider
            value={{
                activeSession,
                selectedSession,
                currentSession,
                allSessions,
                isLoading,
                switchSession,
                refreshSessions,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
