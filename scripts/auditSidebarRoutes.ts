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
    for (const file of files) {
        const rel = file.slice(root.length).replace(/\\/g, '/');
        if (rel.endsWith('/page.tsx')) {
            const route = rel.replace('/page.tsx', '');
            paths.add(route === '' ? '/' : route);
        }
        if (rel.endsWith('/layout.tsx')) {
            const route = rel.replace('/layout.tsx', '');
            paths.add(route === '' ? '/' : route);
        }
    }
    return paths;
}

function getSidebarLinks(): Set<string> {
    const path = join(process.cwd(), 'components', 'layout', 'Sidebar.tsx');
    const content = readFileSync(path, 'utf8');
    const regex = /href: "([^"]+)"/g;
    const set = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
        const path = m[1]?.trim();
        if (!path) continue;
        set.add(path);
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
    const notInSidebar = [...pages].filter(x => !sider.has(x) && x.startsWith('/admin'));
    notInSidebar.forEach(x => console.log(' ', x));
}

run();
