import React from 'react';
import ClassGrid from '../../components/classes/ClassGrid';
import { Box } from '@mui/material';
import PageHeader from '../../components/PageHeader';

const ClassList: React.FC = () => {
    return (
        <Box>
            <PageHeader title="All Classes" />
            <Box p={3}>
                <ClassGrid />
            </Box>
        </Box>
    );
};

export default ClassList;
