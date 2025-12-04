import { FormControl, Select, MenuItem, Box, Typography, Chip } from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { useSession } from '../contexts/SessionContext';

export default function SessionSelector() {
    const { selectedSession, allSessions, switchSession, isLoading } = useSession();

    if (isLoading || !selectedSession) {
        return (
            <Box sx={{ px: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    return (
        <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
                value={selectedSession.id}
                onChange={(e) => switchSession(Number(e.target.value))}
                startAdornment={<CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />}
                sx={{
                    backgroundColor: 'background.paper',
                    '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        py: 1,
                    },
                }}
            >
                {allSessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography variant="body2">{session.name}</Typography>
                            {session.isActive && (
                                <Chip label="Active" size="small" color="success" sx={{ ml: 'auto' }} />
                            )}
                            {session.isSetupMode && !session.isActive && (
                                <Chip label="Setup" size="small" color="warning" sx={{ ml: 'auto' }} />
                            )}
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
