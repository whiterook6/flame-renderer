import * as esbuild from "esbuild";
import { sassPlugin } from 'esbuild-sass-plugin';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const run = async () => {
    const outputDir = path.join(__dirname, "/../output");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const files = fs.readdirSync(outputDir);
    await Promise.all(files.map(file => {
        return fs.promises.unlink(path.join(outputDir, file));
    }));
    const srcHtml = path.join(__dirname, "../src/index.html");
    const outHtml = path.join(__dirname, "../output/index.html");
    await Promise.all([
        fs.promises.copyFile(srcHtml, outHtml),
        esbuild.build({
            entryPoints: ['src/index.ts', 'src/worker.ts'],
            bundle: true,
            outdir: 'output', // outputs output/index.js and output/worker.js
            platform: 'browser', // or 'node' as needed
            resolveExtensions: ['.ts', '.d.ts', '.js'],
            plugins: [sassPlugin()],
        })
    ]);
};

run().catch((error) => {console.error(error); process.exit(1)});
