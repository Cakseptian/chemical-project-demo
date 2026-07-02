"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { createContext, useContext } from "react";
import type Lenis from "lenis";
import type { ReactNode } from "react";

// Context to share the Lenis instance with any component in the tree
const LenisContext = createContext<Lenis | null>(null);

export function useLenisInstance() {
    return useContext(LenisContext);
}

function LenisInner({ children }: { children: ReactNode }) {
    const lenis = useLenis();
    return (
        <LenisContext.Provider value={lenis ?? null}>
            {children}
        </LenisContext.Provider>
    );
}

interface LenisProviderProps {
    children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
    return (
        <ReactLenis
            root
            options={{
                lerp: 0.1,
                duration: 1.2,
                smoothWheel: true,
                prevent: (node: Element) => {
                    return (
                        node.id === "lenis-prevent" ||
                        node.closest("[data-lenis-prevent]") !== null
                    );
                },
            }}
        >
            <LenisInner>
                {children}
            </LenisInner>
        </ReactLenis>
    );
}
