import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, filelist: string[] = []): string[] {
    const files = readdirSync(dir, { withFileTypes: true });
    files.forEach((file) => {
        const fullPath = join(dir, file.name);
        if (file.isDirectory()) {
            walk(fullPath, filelist);
        } else if (file.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
            filelist.push(fullPath);
        }
    });
    return filelist;
}

function getAllHrefPaths(): Set<string> {
    const root = join(process.cwd(), 'app');
    const files = walk(root);

    const hrefRegex = /href=(?:"|')([^"'#?]+)(?:"|')/g;
    const linkRegex = /Link\s+href=(?:"|')([^"'#?]+)(?:"|')/g;

    const out = new Set<string>();
    for (const file of files) {
        const contents = readFileSync(file, 'utf8');
        let match: RegExpExecArray | null;
        while ((match = hrefRegex.exec(contents)) !== null) {
            const path = match[1]?.trim();
            if (!path) continue;
            if (path.startsWith('/') && !path.startsWith('/api')) out.add(path);
        }
        while ((match = linkRegex.exec(contents)) !== null) {
            const path = match[1]?.trim();
            if (!path) continue;
            if (path.startsWith('/') && !path.startsWith('/api')) out.add(path);
        }
    }

    return out;
}

function getRouteConfigPaths(): Set<string> {
    const routeConfigFile = join(process.cwd(), 'lib', 'rbac', 'routeConfig.ts');
    const contents = readFileSync(routeConfigFile, 'utf8');
    const routeRegex = /path:\s*'([^']+)'/g;
    const out = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = routeRegex.exec(contents)) !== null) {
        const path = match[1]?.trim();
        if (!path) continue;
        out.add(path);
    }
    return out;
}

function report() {
    const hrefPaths = getAllHrefPaths();
    const routePaths = getRouteConfigPaths();

    const missingInConfig = [...hrefPaths].filter((p) => !routePaths.has(p));
    const deadConfig = [...routePaths].filter((p) => !hrefPaths.has(p));

    console.log('=== Route audit report ===');
    console.log('Total href route paths detected:', hrefPaths.size);
    console.log('Route config entry paths:', routePaths.size);
    console.log('Paths referenced in UI but missing in routeConfig:');
    missingInConfig.sort().forEach((p) => console.log('  ', p));
    console.log('RouteConfig paths not currently referenced from anywhere (possible leftover):');
    deadConfig.sort().forEach((p) => console.log('  ', p));

    if (missingInConfig.length === 0 && deadConfig.length === 0) {
        console.log('OK: no the aforementioned mismatches');
    }
}

report();
