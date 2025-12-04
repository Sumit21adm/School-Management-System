import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#f5f5f5',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" color="error" gutterBottom fontWeight="bold">
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              An error occurred while rendering the application.
            </Typography>
            
            <Box
              sx={{
                mt: 2,
                mb: 4,
                p: 2,
                bgcolor: '#fff0f0',
                borderRadius: 1,
                border: '1px solid #ffcdd2',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: 200,
              }}
            >
              <Typography variant="subtitle2" color="error" fontFamily="monospace">
                {this.state.error?.toString()}
              </Typography>
              {this.state.errorInfo && (
                <Typography variant="caption" fontFamily="monospace" display="block" mt={1}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
