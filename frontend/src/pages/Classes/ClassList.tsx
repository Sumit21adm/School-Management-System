import React from 'react';
import ClassGrid from '../../components/classes/ClassGrid';
import { Box, Typography } from '@mui/material';

const ClassList: React.FC = () => {
    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                All Classes
            </Typography>
            <ClassGrid />
        </Box>
    );
};

export default ClassList;
