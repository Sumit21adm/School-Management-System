'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { ColorModeProvider, useColorMode } from '@/contexts/ThemeContext';
import { SessionProvider as SchoolSessionProvider } from '@/contexts/SessionContext';
import { getTheme } from '@/lib/theme';

function MuiThemeWrapper({ children }: { children: React.ReactNode }) {
    const { mode } = useColorMode();
    const theme = useMemo(() => getTheme(mode), [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                retry: 1,
            },
        },
    }));

    return (
        <NextAuthSessionProvider>
            <QueryClientProvider client={queryClient}>
                <SchoolSessionProvider>
                    <AppRouterCacheProvider>
                        <ColorModeProvider>
                            <MuiThemeWrapper>
                                {children}
                            </MuiThemeWrapper>
                        </ColorModeProvider>
                    </AppRouterCacheProvider>
                </SchoolSessionProvider>
            </QueryClientProvider>
        </NextAuthSessionProvider>
    );
}
