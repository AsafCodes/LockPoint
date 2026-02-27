'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface DisplayContextType {
    isLargeUI: boolean;
    toggleLargeUI: () => void;
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export function DisplayProvider({ children }: { children: React.ReactNode }) {
    const [isLargeUI, setIsLargeUI] = useState(false);

    useEffect(() => {
        // Load preference from local storage on mount
        const stored = localStorage.getItem('lockpoint_ui_large');
        if (stored === 'true') {
            setIsLargeUI(true);
            document.documentElement.classList.add('ui-large');
        }
    }, []);

    const toggleLargeUI = () => {
        const newValue = !isLargeUI;
        setIsLargeUI(newValue);
        localStorage.setItem('lockpoint_ui_large', String(newValue));

        if (newValue) {
            document.documentElement.classList.add('ui-large');
        } else {
            document.documentElement.classList.remove('ui-large');
        }
    };

    return (
        <DisplayContext.Provider value={{ isLargeUI, toggleLargeUI }}>
            {children}
        </DisplayContext.Provider>
    );
}

export function useDisplay() {
    const context = useContext(DisplayContext);
    if (context === undefined) {
        throw new Error('useDisplay must be used within a DisplayProvider');
    }
    return context;
}
