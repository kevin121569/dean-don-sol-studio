import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, "..");
const androidRoot = path.join(wrapperRoot, "android");
const manifestPath = path.join(androidRoot, "app/src/main/AndroidManifest.xml");
const xmlRoot = path.join(androidRoot, "app/src/main/res/xml");

let manifest = await readFile(manifestPath, "utf8");

if (!manifest.includes("<application")) {
  throw new Error("Generated AndroidManifest.xml has no <application> element.");
}

function setApplicationAttribute(source, attribute, value) {
  const re = new RegExp(`(<application\\b[^>]*?)\\sandroid:${attribute}="[^"]*"`);
  if (re.test(source)) return source.replace(re, `$1 android:${attribute}="${value}"`);
  return source.replace(/<application\b/, `<application android:${attribute}="${value}"`);
}

manifest = setApplicationAttribute(manifest, "allowBackup", "false");
manifest = setApplicationAttribute(manifest, "fullBackupContent", "@xml/backup_rules");
manifest = setApplicationAttribute(manifest, "dataExtractionRules", "@xml/data_extraction_rules");

await mkdir(xmlRoot, {recursive: true});

const legacyRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="root" path="." />
    <exclude domain="file" path="." />
    <exclude domain="database" path="." />
    <exclude domain="sharedpref" path="." />
    <exclude domain="external" path="." />
</full-backup-content>
`;

const extractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
        <exclude domain="device_root" path="." />
        <exclude domain="device_file" path="." />
        <exclude domain="device_database" path="." />
        <exclude domain="device_sharedpref" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
        <exclude domain="device_root" path="." />
        <exclude domain="device_file" path="." />
        <exclude domain="device_database" path="." />
        <exclude domain="device_sharedpref" path="." />
    </device-transfer>
</data-extraction-rules>
`;

await writeFile(manifestPath, manifest);
await writeFile(path.join(xmlRoot, "backup_rules.xml"), legacyRules);
await writeFile(path.join(xmlRoot, "data_extraction_rules.xml"), extractionRules);

console.log("HARNESS native privacy policy applied: backups and device transfer explicitly disabled.");
