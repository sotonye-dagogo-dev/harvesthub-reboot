import { Spin } from 'antd';

export default function GlobalLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="flex flex-col items-center gap-4">
                <Spin size="large" />
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    Loading…
                </p>
            </div>
        </div>
    );
}
