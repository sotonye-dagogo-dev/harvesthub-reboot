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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <Result
                status="500"
                title={<span className="text-gray-900 dark:text-white">Something went wrong</span>}
                subTitle={
                    <span className="text-gray-500 dark:text-gray-400">
                        {error.message || 'An unexpected error occurred. Please try again.'}
                    </span>
                }
                extra={[
                    <Button
                        key="retry"
                        type="primary"
                        onClick={reset}
                        className="bg-purple-600 hover:bg-purple-700 border-purple-600"
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
                <p className="mt-4 text-xs text-gray-400 font-mono">
                    Error ID: {error.digest}
                </p>
            )}
        </div>
    );
}
