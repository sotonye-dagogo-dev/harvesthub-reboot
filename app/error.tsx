'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken dark:bg-ds-surface-sunken px-4">
            <Result
                status="500"
                title={<span className="text-ds-text-primary">Something went wrong</span>}
                subTitle={
                    <span className="text-ds-text-tertiary">
                        {error.message || 'An unexpected error occurred. Please try again.'}
                    </span>
                }
                extra={[
                    <Button
                        key="retry"
                        type="primary"
                        onClick={reset}
                        className="bg-ds-brand-primary hover:bg-ds-brand-primary-hover border-ds-border-brand"
                    >
                        Try Again
                    </Button>,
                    <Button
                        key="home"
                        onClick={() => (window.location.href = '/')}
                    >
                        Go Home
                    </Button>,
                ]}
            />
            {process.env.NODE_ENV === 'development' && error.digest && (
                <p className="mt-4 text-xs text-ds-text-placeholder font-mono">
                    Error ID: {error.digest}
                </p>
            )}
        </div>
    );
}
