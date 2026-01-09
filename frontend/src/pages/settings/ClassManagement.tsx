import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Search as SearchIcon,
    Sort as SortIcon
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import ClassGrid from '../../components/classes/ClassGrid';
import { classService } from '../../lib/api';

const ClassManagement = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'order' | 'name'>('order');

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const data = await classService.getAll();
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClasses = useMemo(() => {
        let result = [...classes];

        // Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(cls =>
                cls.name.toLowerCase().includes(lowerTerm) ||
                cls.displayName.toLowerCase().includes(lowerTerm)
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'order') {
                return a.order - b.order;
            } else {
                return a.displayName.localeCompare(b.displayName);
            }
        });

        return result;
    }, [classes, searchTerm, sortBy]);

    return (
        <Box>
            <PageHeader
                title="Class & Subject Management"
                subtitle="View and manage classes, sections, and subjects"
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Grid container spacing={2} alignItems="center" sx={{ pb: 2 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search classes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                label="Sort By"
                                onChange={(e) => setSortBy(e.target.value as 'order' | 'name')}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <SortIcon color="action" />
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value="order">Order (Default)</MenuItem>
                                <MenuItem value="name">Name (Alphabetical)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <ClassGrid classes={filteredClasses} onRefresh={loadClasses} />
            )}
        </Box>
    );
};

export default ClassManagement;
