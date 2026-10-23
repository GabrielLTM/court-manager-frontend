import { loadEnv } from 'vite';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const args = process.argv.slice(2);
const vars = loadEnv(args[0] === 'serve' ? 'development' : 'production', process.cwd(), 'VITE_');
const apiMode = vars.VITE_API_MODE === 'http' ? 'http' : 'mock';
const config = JSON.stringify({ apiMode, apiBaseUrl: vars.VITE_API_BASE_URL || '/api' });
// CLI serve forwards define to the application builder; config contains only public frontend values.
args.push('--define', `ARENA_ENV=${config}`);
if (args[0] === 'serve') {
  mkdirSync('.angular', { recursive: true });
  writeFileSync(
    '.angular/proxy.json',
    JSON.stringify({
      '/api': { target: vars.VITE_BACKEND_URL || 'http://localhost:5160', changeOrigin: true },
    }),
  );
  args.push('--proxy-config', '.angular/proxy.json');
}
const result = spawnSync(process.execPath, ['node_modules/@angular/cli/bin/ng.js', ...args], {
  stdio: 'inherit',
  env: { ...process.env, NG_CLI_ANALYTICS: 'false' },
});
process.exit(result.status ?? 1);
