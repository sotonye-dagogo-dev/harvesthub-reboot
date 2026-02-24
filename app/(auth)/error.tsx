'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function AuthError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Auth error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <Result
                status="warning"
                title={<span className="text-ds-text-primary">Authentication Error</span>}
                subTitle={
                    <span className="text-ds-text-tertiary">
                        {error.message || 'Something went wrong during authentication.'}
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
                    <Button key="home" onClick={() => (window.location.href = '/')}>
                        Go Home
                    </Button>,
                ]}
            />
        </div>
    );
}
