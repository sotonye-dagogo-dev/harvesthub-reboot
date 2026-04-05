import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, filelist: string[] = []): string[] {
    const files = readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
        const full = join(dir, file.name);
        if (file.isDirectory()) walk(full, filelist);
        else if (file.isFile() && full.endsWith('.tsx')) filelist.push(full);
    });
    return filelist;
}

function getAppPagePaths(): Set<string> {
    const root = join(process.cwd(), 'app');
    const files = walk(root);
    const paths = new Set<string>();

    const normalizeRoute = (route: string): string => {
        const cleanedSegments = route
            .split('/')
            .filter(Boolean)
            .filter((segment) => !segment.startsWith('(') && !segment.endsWith(')'));

        if (cleanedSegments.length === 0) return '/';
        return `/${cleanedSegments.join('/')}`;
    };

    for (const file of files) {
        const rel = file.slice(root.length).replace(/\\/g, '/');
        if (rel.endsWith('/page.tsx')) {
            const route = rel.replace('/page.tsx', '');
            paths.add(normalizeRoute(route));
        }
    }
    return paths;
}

function getSidebarLinks(): Set<string> {
    const path = join(process.cwd(), 'components', 'layout', 'Sidebar.tsx');
    const content = readFileSync(path, 'utf8');
    const set = new Set<string>();

    const collectRoutes = (blockBody: string) => {
        const pathRegex = /"([^"]+)"/g;
        let pathMatch: RegExpExecArray | null;

        while ((pathMatch = pathRegex.exec(blockBody)) !== null) {
            const routePath = pathMatch[1]?.trim();
            if (!routePath || !routePath.startsWith('/')) continue;
            set.add(routePath);
        }
    };

    const setBlockRegex = /const\s+(ADMIN_LINKS|VENDOR_LINKS)\s*=\s*new Set\(\[([\s\S]*?)\]\);/g;
    let blockMatch: RegExpExecArray | null;

    while ((blockMatch = setBlockRegex.exec(content)) !== null) {
        collectRoutes(blockMatch[2] || '');
    }

    // New sidebar structure uses ordered arrays for better UX ordering.
    const arrayBlockRegex = /const\s+(ADMIN_LINK_ORDER|VENDOR_LINK_ORDER)\s*=\s*\[([\s\S]*?)\]\s*as const;/g;
    while ((blockMatch = arrayBlockRegex.exec(content)) !== null) {
        collectRoutes(blockMatch[2] || '');
    }

    return set;
}

function run() {
    const pages = getAppPagePaths();
    const sider = getSidebarLinks();

    const missing = [...sider].filter(x => !pages.has(x));
    console.log('Found sidebar links:', sider.size);
    console.log('Found app routes:', pages.size);
    console.log('Links in sidebar missing pages:');
    missing.forEach(x => console.log(' ', x));

    console.log('Deprecated pages (exists but not in sidebar):');
    const notInSidebar = [...pages].filter(
        (x) => !sider.has(x) && (x === '/admin' || x.startsWith('/admin/') || x === '/vendor' || x.startsWith('/vendor/'))
    );
    notInSidebar.forEach(x => console.log(' ', x));

    if (missing.length === 0) {
        console.log('OK: all sidebar links map to existing app pages.');
    }
}

run();
