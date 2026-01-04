
'use client';

import {
    Box,
    FormControl,
    Select,
    MenuItem,
    Typography,
    CircularProgress
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { sessionService } from '@/lib/api';
import { useSessionContext } from '@/contexts/SessionContext';
import { CalendarToday } from '@mui/icons-material';

export default function SessionSelector() {
    const { selectedSessionId, setSession } = useSessionContext();

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => sessionService.getAll(true),
        staleTime: 5 * 60 * 1000,
    });

    const sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData as any)?.sessions || [];

    if (isLoading && !selectedSessionId) {
        return <CircularProgress size={20} />;
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'action.hover',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            mr: 2
        }}>
            <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
            <FormControl variant="standard" size="small">
                <Select
                    value={selectedSessionId || ''}
                    onChange={(e) => {
                        const id = Number(e.target.value);
                        const session = sessions.find((s: any) => s.id === id);
                        if (session) {
                            setSession(id, session.name);
                            // Optional: reload page to refresh data completely if context updates aren't enough
                            // window.location.reload(); 
                        }
                    }}
                    disableUnderline
                    sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        minWidth: 100,
                        '& .MuiSelect-select': {
                            py: 0.5,
                            pr: '24px !important', // Ensure space for arrow
                        }
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: { mt: 1, maxHeight: 300 }
                        }
                    }}
                >
                    {sessions.map((session: any) => (
                        <MenuItem key={session.id} value={session.id}>
                            {session.name} {session.isActive && '(Active)'}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
