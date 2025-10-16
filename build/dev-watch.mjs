import * as esbuild from "esbuild";
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
    await fs.promises.copyFile(srcHtml, outHtml);

    const context = await esbuild.context({
        entryPoints: ["src/index.ts", "src/worker.ts"],
        bundle: true,
        minify: false,
        sourcemap: true,
        outdir: 'output', // outputs output/index.js and output/worker.js
        platform: 'browser',
        resolveExtensions: ['.ts', '.d.ts', '.js'],
    });
    
    return context.watch();
};

run().catch((error) => {console.error(error); process.exit(1)});
