import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Tooltip,
    IconButton,
    Tabs,
    Tab,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { classService } from '../../lib/api';
import { useTheme } from '@mui/material/styles';
import SubjectManagement from '../../components/subjects/SubjectManagement';


const ClassManagement = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);

    const { data: classes, isLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                {classes && classes.length > 0 && (
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider', maxWidth: 300 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                            Total Classes
                        </Typography>
                        <Typography variant="h3" color="primary" fontWeight="600" align="center">
                            {classes.length}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ flex: 1, ml: 3 }}>
                    <Typography variant="h5" fontWeight="600">
                        Class & Subject Management
                    </Typography>
                    {classes && classes.length > 0 && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {classes[0]?.displayName} ({classes[0]?.order}) to {classes[classes.length - 1]?.displayName} ({classes[classes.length - 1]?.order})
                            </Typography>
                            <Tooltip
                                title={
                                    <Box sx={{ p: 1 }}>
                                        <Typography variant="caption" fontWeight="600" display="block" sx={{ mb: 1 }}>
                                            All Classes:
                                        </Typography>
                                        {classes.map((cls: any) => (
                                            <Typography key={cls.id} variant="caption" display="block">
                                                {cls.order}. {cls.displayName}
                                            </Typography>
                                        ))}
                                    </Box>
                                }
                                placement="bottom-start"
                            >
                                <IconButton size="small" color="info" sx={{ mt: 0.5, ml: -1 }}>
                                    <InfoIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Box>

                {classes && classes.length > 0 && (
                    <Box sx={{ visibility: 'hidden' }}>
                        <IconButton color="info">
                            <InfoIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Classes" />
                <Tab label="Subjects" />
            </Tabs>

            {activeTab === 0 && (
                <Box>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        Classes are managed by the system administrator and cannot be modified directly.
                    </Typography>
                </Box>
            )}

            {activeTab === 1 && (
                <SubjectManagement />
            )}

            {(!classes || classes.length === 0) && (
                <Paper sx={{ p: 4, borderRadius: 2, boxShadow: theme.shadows[2], maxWidth: 600 }}>
                    <Typography variant="body1" color="text.secondary" align="center">
                        No classes found. Please ask admin to seed the database.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default ClassManagement;
