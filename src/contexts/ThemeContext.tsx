'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { PaletteMode } from '@mui/material';

interface ColorModeContextType {
    mode: PaletteMode;
    toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
    mode: 'light',
    toggleColorMode: () => { },
});

export const useColorMode = () => useContext(ColorModeContext);

interface ColorModeProviderProps {
    children: React.ReactNode;
}

export const ColorModeProvider: React.FC<ColorModeProviderProps> = ({ children }) => {
    const [mode, setMode] = useState<PaletteMode>('light');

    // Load from localStorage on mount (client-side only)
    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') as PaletteMode;
        if ((savedMode === 'dark' || savedMode === 'light') && savedMode !== mode) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMode(savedMode);
        }
    }, [mode]);

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const newMode = prevMode === 'light' ? 'dark' : 'light';
                    localStorage.setItem('themeMode', newMode);
                    return newMode;
                });
            },
        }),
        [mode]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            {children}
        </ColorModeContext.Provider>
    );
};
