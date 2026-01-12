import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import { Info } from 'lucide-react';

interface QuickTip {
    text: string;
    highlight?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    quickTips?: QuickTip[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, quickTips }) => {
    const [tipsOpen, setTipsOpen] = useState(false);

    return (
        <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h4" component="h1" fontWeight={600}>
                            {title}
                        </Typography>
                        <Tooltip title="Quick Tips">
                            <IconButton
                                onClick={() => setTipsOpen(true)}
                                size="small"
                                sx={{ color: 'primary.main' }}
                            >
                                <Info size={22} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {action && <Box>{action}</Box>}
            </Box>

            {/* Quick Tips Dialog */}
            <Dialog open={tipsOpen} onClose={() => setTipsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>
                    Quick Tips
                </DialogTitle>
                <DialogContent sx={{ mt: 2, pt: 2 }}>
                    {quickTips && quickTips.length > 0 ? (
                        quickTips.map((tip, index) => (
                            <Typography key={index} variant="body1" sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                                <span style={{ marginRight: '8px' }}>•</span>
                                <span>
                                    {tip.highlight ? (
                                        <>
                                            {tip.text.split(tip.highlight).map((part, i, arr) => (
                                                <React.Fragment key={i}>
                                                    {part}
                                                    {i < arr.length - 1 && <strong>{tip.highlight}</strong>}
                                                </React.Fragment>
                                            ))}
                                        </>
                                    ) : (
                                        tip.text
                                    )}
                                </span>
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No tips available for this page yet.
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default PageHeader;
