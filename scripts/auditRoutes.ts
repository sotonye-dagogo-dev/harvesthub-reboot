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

function normalizePath(path: string): string {
    if (!path.startsWith('/')) return path;
    if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
    return path;
}

function getRouteReferences(): Set<string> {
    const roots = [join(process.cwd(), 'app'), join(process.cwd(), 'components'), join(process.cwd(), 'lib')];
    const files = roots.flatMap((root) => walk(root));

    const patterns = [
        /href=(?:"|')([^"'#?]+)(?:"|')/g,
        /href:\s*(?:"|')([^"'#?]+)(?:"|')/g,
        /path:\s*(?:"|')([^"'#?]+)(?:"|')/g,
        /router\.push\((?:"|')([^"'#?]+)(?:"|')\)/g,
        /redirect\((?:"|')([^"'#?]+)(?:"|')\)/g,
    ];

    const out = new Set<string>();
    for (const file of files) {
        const contents = readFileSync(file, 'utf8');
        for (const regex of patterns) {
            let match: RegExpExecArray | null;
            while ((match = regex.exec(contents)) !== null) {
                const found = match[1]?.trim();
                if (!found || !found.startsWith('/') || found.startsWith('/api')) continue;
                out.add(normalizePath(found));
            }
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
        out.add(normalizePath(path));
    }
    return out;
}

function getAppPagePaths(): Set<string> {
    const root = join(process.cwd(), 'app');
    const files = walk(root);
    const out = new Set<string>();

    for (const file of files) {
        const rel = file.slice(root.length).replace(/\\/g, '/');
        if (!rel.endsWith('/page.tsx')) continue;

        const route = rel.replace('/page.tsx', '');
        const segments = route
            .split('/')
            .filter(Boolean)
            .filter((segment) => !segment.startsWith('(') && !segment.endsWith(')'));

        const normalized = segments.length === 0 ? '/' : `/${segments.join('/')}`;
        out.add(normalizePath(normalized));
    }

    return out;
}

function routePatternToRegex(route: string): RegExp {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dynamicReplaced = escaped
        .replace(/\\\[\.\.\.[^\]]+\\\]/g, '(.+)')
        .replace(/\\\[[^\]]+\\\]/g, '([^/]+)');
    return new RegExp(`^${dynamicReplaced}$`);
}

function pathMatchesPages(path: string, pages: Set<string>): boolean {
    if (pages.has(path)) return true;

    for (const page of pages) {
        if (!page.includes('[')) continue;
        if (routePatternToRegex(page).test(path)) return true;
    }

    return false;
}

function report() {
    const hrefPaths = getRouteReferences();
    const routePaths = getRouteConfigPaths();
    const appPages = getAppPagePaths();

    const missingInConfig = [...hrefPaths].filter((p) => !routePaths.has(p));
    const deadLinkedPaths = [...hrefPaths].filter((p) => !pathMatchesPages(p, appPages));
    const configMissingPages = [...routePaths].filter((p) => !pathMatchesPages(p, appPages));

    console.log('=== Route audit report ===');
    console.log('Total referenced route paths detected:', hrefPaths.size);
    console.log('Total app pages discovered:', appPages.size);
    console.log('Route config entry paths:', routePaths.size);
    console.log('Referenced routes missing app pages (possible dead links):');
    deadLinkedPaths.sort().forEach((p) => console.log('  ', p));
    console.log('Paths referenced in UI but missing in routeConfig:');
    missingInConfig.sort().forEach((p) => console.log('  ', p));
    console.log('RouteConfig paths missing app pages (possible stale policy entries):');
    configMissingPages.sort().forEach((p) => console.log('  ', p));

    if (deadLinkedPaths.length === 0 && missingInConfig.length === 0 && configMissingPages.length === 0) {
        console.log('OK: no dead-link or route-config mismatches detected');
    }
}

report();
