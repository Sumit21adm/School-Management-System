import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Chip,
    Paper
} from '@mui/material';
import {
    ExpandMore,
    MenuBook,
    School,
    Payments,
    Commute,
    Settings,
    HelpOutline
} from '@mui/icons-material';

interface UserGuideDialogProps {
    open: boolean;
    onClose: () => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`guide-tabpanel-${index}`}
            aria-labelledby={`guide-tab-${index}`}
            {...other}
            style={{ height: '100%', overflow: 'auto' }}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function UserGuideDialog({ open, onClose }: UserGuideDialogProps) {
    const [value, setValue] = useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
            PaperProps={{
                sx: { height: '80vh', borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                <MenuBook color="primary" />
                <Box>
                    <Typography variant="h6" fontWeight={700}>Application User Guide</Typography>
                    <Typography variant="caption" color="text.secondary">Comprehensive guide to features, inputs, and workflows</Typography>
                </Box>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="user guide tabs" variant="scrollable" scrollButtons="auto">
                    <Tab icon={<HelpOutline />} iconPosition="start" label="Getting Started" />
                    <Tab icon={<School />} iconPosition="start" label="Admissions & Students" />
                    <Tab icon={<Payments />} iconPosition="start" label="Fee Management" />
                    <Tab icon={<Commute />} iconPosition="start" label="Transport" />
                    <Tab icon={<Settings />} iconPosition="start" label="Configuration" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>

                {/* TAB 0: GETTING STARTED */}
                <TabPanel value={value} index={0}>
                    <Typography variant="h5" gutterBottom fontWeight={600}>Welcome to School ERP</Typography>
                    <Typography paragraph color="text.secondary">
                        This platform allows you to manage all aspects of your educational institution, from student admissions to fee collection and transport management.
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>🚀 Quick Start Checklist</Typography>
                        <List dense>
                            <ListItem>
                                <ListItemText
                                    primary="1. Configure Academic Session"
                                    secondary="Go to Settings > Sessions to ensure the current academic year is active."
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="2. Set up Fee Structure"
                                    secondary="Navigate to Fee Management > Fee Structure. Define fee heads (Tuition, Transport) and assign them to classes."
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="3. Enroll Students"
                                    secondary="Use the 'Admissions' module to add new students to the system."
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </TabPanel>

                {/* TAB 1: ADMISSIONS */}
                <TabPanel value={value} index={1}>
                    <Typography variant="h6" gutterBottom color="primary">Student Management</Typography>

                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography fontWeight={600}>New Admission Process</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" paragraph>
                                To admit a new student, navigate to <strong>Student Info {'>'} Admissions</strong>.
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom>Required Inputs:</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                <Chip label="Student Name" size="small" />
                                <Chip label="Date of Birth" size="small" />
                                <Chip label="Father's Name" size="small" />
                                <Chip label="Class Selection" size="small" />
                                <Chip label="Mobile Number" size="small" />
                            </Box>
                            <Typography variant="subtitle2" gutterBottom>Workflow:</Typography>
                            <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                                <ListItem><ListItemText primary="1. Fill Personal Details" secondary="Enter name, DOB, gender, and category." /></ListItem>
                                <ListItem><ListItemText primary="2. Parent Information" secondary="Father/Mother names and contact details are crucial for communication." /></ListItem>
                                <ListItem><ListItemText primary="3. Academic Details" secondary="Assign Admission Number (auto or manual) and select Class/Section." /></ListItem>
                            </List>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography fontWeight={600}>Promoting Students</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2">
                                Use the <strong>Promotions</strong> module at the end of a session to move students to the next class in bulk.
                                Select the source class and target class, select students, and click "Promote".
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </TabPanel>

                {/* TAB 2: FEE MANAGEMENT */}
                <TabPanel value={value} index={2}>
                    <Typography variant="h6" gutterBottom color="primary">Fee Management System</Typography>

                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography fontWeight={600}>Fee Structure Setup</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" paragraph>
                                Before collecting fees, you must define <strong>what</strong> to charge.
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Fee Heads" secondary="Create heads like 'Tuition Fee', 'Exam Fee', 'Computer Fee'." />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Fee Structure" secondary="Link Fee Heads to Classes. Example: Class 10 pays ₹5000 Tuition Fee Monthly." />
                                </ListItem>
                            </List>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography fontWeight={600}>Collecting Fees</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" paragraph>
                                Go to <strong>Fee Collection</strong>. Search for a student by ID or Name.
                            </Typography>
                            <Typography variant="subtitle2">Steps:</Typography>
                            <ol style={{ fontSize: '0.875rem', color: '#666' }}>
                                <li>Search Student.</li>
                                <li>Select the Month/Installment to pay.</li>
                                <li>System auto-calculates Total (including Transport/Late fees if applicable).</li>
                                <li>Enter "Paying Amount".</li>
                                <li>Select Mode (Cash/Online/Cheque).</li>
                                <li>Click <strong>Collect Fee</strong> to generate a receipt.</li>
                            </ol>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography fontWeight={600}>Demand Bill Generation</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2">
                                Generate monthly bills for students to notify parents of dues.
                                <br />
                                <strong>Inputs:</strong> Select Class or 'All Students', Select Month.
                                <br />
                                <strong>Output:</strong> PDF Bills with breakdown of dues, previous balance, and total payable.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </TabPanel>

                {/* TAB 3: TRANSPORT */}
                <TabPanel value={value} index={3}>
                    <Typography variant="h6" gutterBottom color="primary">Transport Management</Typography>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.soft' }}>
                        <Typography variant="body2">
                            Transport fees are calculated based on <strong>Distance Slabs</strong>.
                        </Typography>
                    </Paper>

                    <List>
                        <ListItem>
                            <ListItemText
                                primary="1. Define Fare Slabs"
                                secondary="Settings > Fare Slabs. E.g., 0-5km = ₹1000, 5-10km = ₹1500."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="2. Create Routes & Stops"
                                secondary="Define bus routes and specific stops with their distance from school."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="3. Assign Transport"
                                secondary="Go to Transport > Assignments. Link a student to a Pickup/Drop stop. The fee is auto-applied based on distance."
                            />
                        </ListItem>
                    </List>
                </TabPanel>

                {/* TAB 4: SETTINGS */}
                <TabPanel value={value} index={4}>
                    <Typography variant="h6" gutterBottom color="primary">System Configuration</Typography>
                    <Typography variant="body2" paragraph>
                        Admin settings to control the application behavior.
                    </Typography>

                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography fontWeight={600}>User Management</Typography>
                            <Typography variant="caption" display="block">
                                Create staff accounts (Teachers, Accountants). Assign roles to restrict access.
                            </Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography fontWeight={600}>Print Settings</Typography>
                            <Typography variant="caption" display="block">
                                Upload School Logo, set Address and Contact info for Receipts/Bills.
                            </Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography fontWeight={600}>Class Management</Typography>
                            <Typography variant="caption" display="block">
                                Define Classes (1, 2, 3...) and Sections (A, B, C...).
                            </Typography>
                        </Paper>
                    </Box>
                </TabPanel>

            </DialogContent>
            <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 3, py: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Close Guide
                </Button>
            </DialogActions>
        </Dialog>
    );
}
