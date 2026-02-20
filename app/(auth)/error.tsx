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
                title={<span className="text-gray-900 dark:text-white">Authentication Error</span>}
                subTitle={
                    <span className="text-gray-500 dark:text-gray-400">
                        {error.message || 'Something went wrong during authentication.'}
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
                    <Button key="home" onClick={() => (window.location.href = '/')}>
                        Go Home
                    </Button>,
                ]}
            />
        </div>
    );
}
