import fs from 'fs-extra';
import archiver from 'archiver';

function zipDirectory(sourceDir: string, outputFilePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(outputFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(archive.pointer() + ' total bytes');
            resolve();
        });

        archive.on('warning', (err:any) => {
            if (err.code === 'ENOENT') {
                console.warn(err);
            } else {
                reject(err);
            }
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        archive.directory(sourceDir, false);

        archive.finalize();
    });
}

export { zipDirectory }