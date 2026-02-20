'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function VendorError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Vendor section error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <Result
                status="500"
                title={<span className="text-gray-900 dark:text-white">Vendor Dashboard Error</span>}
                subTitle={
                    <span className="text-gray-500 dark:text-gray-400">
                        {error.message || 'An error occurred. Please try again.'}
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
                    <Link key="dashboard" href="/vendor/dashboard">
                        <Button>Back to Dashboard</Button>
                    </Link>,
                ]}
            />
            {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 max-w-md">
                    <summary className="text-xs text-gray-400 cursor-pointer">Dev Details</summary>
                    <pre className="mt-2 text-xs text-red-400 whitespace-pre-wrap break-all bg-gray-950 p-4 rounded">
                        {error.stack}
                    </pre>
                </details>
            )}
        </div>
    );
}
