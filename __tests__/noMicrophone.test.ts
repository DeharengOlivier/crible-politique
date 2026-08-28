import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// The voice mode reads statements out loud. It must never listen.
//
// The browser speech recognition API is not local: on Chromium it streams the
// microphone to a speech service to get a transcript back. Doing that while
// someone is answering political questions would send their voice to a third
// party, and the application says in three places that nothing is sent
// anywhere. The transcript was decorative, so the transmission bought nothing.
//
// This is a static check because the defect is the presence of the call, not
// its behaviour: by the time a test could observe a microphone stream, the
// audio has already left.

const ROOTS = ['app', 'components', 'lib', 'utils', 'public'];

const FORBIDDEN = [
    'SpeechRecognition',
    'webkitSpeechRecognition',
    'getUserMedia',
    'mediaDevices',
    'MediaRecorder'
];

async function sourceFiles(dir: string): Promise<string[]> {
    const found: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) found.push(...(await sourceFiles(full)));
        else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) found.push(full);
    }
    return found;
}

describe('the application never asks for a microphone', () => {
    it.each(FORBIDDEN)('does not reference %s anywhere', async (api) => {
        const offenders: string[] = [];
        for (const root of ROOTS) {
            for (const file of await sourceFiles(root)) {
                const source = await readFile(file, 'utf8');
                // The Permissions-Policy header names the APIs it denies, and
                // naming one is the opposite of calling it.
                if (file.endsWith('next.config.ts')) continue;
                if (source.includes(api)) offenders.push(file);
            }
        }
        expect(offenders).toEqual([]);
    });
});
