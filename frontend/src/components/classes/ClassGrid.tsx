import React, { useEffect, useState } from 'react';
import { classService } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    CircularProgress,
    CardActions,
    Chip,
    Avatar
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ArrowForward as ArrowForwardIcon,
    MenuBook as MenuBookIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ClassData {
    id: number;
    name: string;
    displayName: string;
    order: number;
    sections?: any[];
}

interface ClassGridProps {
    classes?: ClassData[];
    onRefresh?: () => void;
}

const ClassGrid: React.FC<ClassGridProps> = ({ classes: propClasses, onRefresh }) => {
    const [internalClasses, setInternalClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(!propClasses);
    const navigate = useNavigate();
    const theme = useTheme();

    const classes = propClasses || internalClasses;

    useEffect(() => {
        if (!propClasses) {
            loadClasses();
        } else {
            setLoading(false);
        }
    }, [propClasses]);

    const loadClasses = async () => {
        try {
            const data = await classService.getAll();
            setInternalClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await classService.delete(id);
                if (onRefresh) {
                    onRefresh();
                } else {
                    loadClasses();
                }
            } catch (error) {
                alert('Failed to delete class');
            }
        }
    }

    const getInitials = (name: string) => {
        // For short names (like "10", "KG"), use the full name
        if (name.length <= 3) {
            return name.toUpperCase();
        }
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const getRandomColor = (id: number) => {
        const colors = [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main,
            '#9c27b0', // Purple
            '#e91e63', // Pink
            '#009688', // Teal
        ];
        return colors[id % colors.length];
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                    xl: 'repeat(5, 1fr)'
                },
                width: '100%'
            }}
        >
            {classes.map((cls) => {
                const avatarColor = getRandomColor(cls.id);

                return (
                    <Card
                        key={cls.id}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.2s',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 4px 20px 0 ${avatarColor}40`,
                                borderColor: avatarColor
                            }
                        }}
                        onClick={() => navigate(`/classes/${cls.id}`)}
                    >
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Avatar
                                    variant="rounded"
                                    sx={{
                                        bgcolor: `${avatarColor}20`,
                                        color: avatarColor,
                                        width: 56,
                                        height: 56,
                                        fontWeight: 'bold',
                                        fontSize: '1.25rem'
                                    }}
                                >
                                    {getInitials(cls.name)}
                                </Avatar>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleDelete(cls.id, e)}
                                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'error.lighter' } }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Typography variant="h6" component="div" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                                {cls.displayName}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                                Class Code: {cls.name}
                            </Typography>

                            <Box display="flex" gap={1} mt={'auto'} flexWrap="wrap">
                                <Chip
                                    icon={<MenuBookIcon style={{ fontSize: 16 }} />}
                                    label={`${cls.sections?.length || 0} Sections`}
                                    size="small"
                                    sx={{ bgcolor: 'background.default', borderRadius: 1 }}
                                />
                                <Chip
                                    icon={<GroupIcon style={{ fontSize: 16 }} />}
                                    label={`Order: ${cls.order}`}
                                    size="small"
                                    sx={{ bgcolor: 'background.default', borderRadius: 1 }}
                                />
                            </Box>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, pt: 0 }}>
                            <Typography variant="body2" sx={{ color: avatarColor, fontWeight: 600 }}>
                                View Details
                            </Typography>
                            <ArrowForwardIcon fontSize="small" sx={{ color: avatarColor }} />
                        </CardActions>
                    </Card>
                );
            })}
        </Box>
    );
};

export default ClassGrid;
