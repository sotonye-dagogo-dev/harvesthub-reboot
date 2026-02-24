'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function BuyerError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('Buyer section error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <Result
                status="500"
                title={<span className="text-ds-text-primary">Page Error</span>}
                subTitle={
                    <span className="text-ds-text-tertiary">
                        {error.message || 'Something went wrong loading this page.'}
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
                    <Link key="home" href="/">
                        <Button>Back to Home</Button>
                    </Link>,
                ]}
            />
        </div>
    );
}
