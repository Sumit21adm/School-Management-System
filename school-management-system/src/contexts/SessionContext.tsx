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

    // Update selected session when sessions load
    useEffect(() => {
        if (activeSession && !selectedSessionId) {
            setSelectedSessionId(activeSession.id);
            localStorage.setItem('selectedSessionId', activeSession.id.toString());
        }
    }, [activeSession, selectedSessionId]);

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
