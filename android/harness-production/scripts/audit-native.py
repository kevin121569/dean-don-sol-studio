from pathlib import Path
import sys
import xml.etree.ElementTree as ET

APP_ID = "com.theidealabstudio.harness"
ANDROID_NS = "{http://schemas.android.com/apk/res/android}"
root = Path(__file__).resolve().parents[1]
android_root = root / "android"
source_manifest = android_root / "app/src/main/AndroidManifest.xml"

failures = []

def require(condition, message):
    if not condition:
        failures.append(message)

require(source_manifest.exists(), "Generated source AndroidManifest.xml is missing.")

if source_manifest.exists():
    tree = ET.parse(source_manifest)
    manifest = tree.getroot()
    application = manifest.find("application")
    require(application is not None, "Source manifest has no <application> element.")
    if application is not None:
        require(application.get(ANDROID_NS + "allowBackup") == "false", "android:allowBackup must be false.")
        require(application.get(ANDROID_NS + "fullBackupContent") == "@xml/backup_rules", "Legacy backup rules are not attached.")
        require(application.get(ANDROID_NS + "dataExtractionRules") == "@xml/data_extraction_rules", "Android 12+ extraction rules are not attached.")

legacy = android_root / "app/src/main/res/xml/backup_rules.xml"
modern = android_root / "app/src/main/res/xml/data_extraction_rules.xml"
require(legacy.exists(), "backup_rules.xml is missing.")
require(modern.exists(), "data_extraction_rules.xml is missing.")

for rules_path in [legacy, modern]:
    if rules_path.exists():
        text = rules_path.read_text(encoding="utf-8")
        for domain in ["root", "file", "database", "sharedpref", "external"]:
            require(f'domain="{domain}" path="."' in text, f"{rules_path.name} does not exclude {domain} data.")

if modern.exists():
    text = modern.read_text(encoding="utf-8")
    require("<cloud-backup>" in text, "Modern extraction rules do not define cloud-backup.")
    require("<device-transfer>" in text, "Modern extraction rules do not define device-transfer.")
    for domain in ["device_root", "device_file", "device_database", "device_sharedpref"]:
        require(f'domain="{domain}" path="."' in text, f"Modern extraction rules do not exclude {domain} data.")

gradle_candidates = [
    android_root / "app/build.gradle",
    android_root / "app/build.gradle.kts",
]
gradle_text = ""
for candidate in gradle_candidates:
    if candidate.exists():
        gradle_text = candidate.read_text(encoding="utf-8")
        break
require(APP_ID in gradle_text, "Generated Gradle app configuration does not contain the approved application ID.")

merged_candidates = sorted(
    p for p in (android_root / "app/build/intermediates").rglob("AndroidManifest.xml")
    if "release" in str(p).lower()
)
require(bool(merged_candidates), "No merged release manifest was produced.")

merged = None
for candidate in reversed(merged_candidates):
    try:
        candidate_root = ET.parse(candidate).getroot()
    except ET.ParseError:
        continue
    if candidate_root.get("package") == APP_ID:
        merged = candidate
        break

if merged is None and merged_candidates:
    merged = merged_candidates[-1]

if merged is not None:
    root_xml = ET.parse(merged).getroot()
    application = root_xml.find("application")
    require(application is not None, f"Merged release manifest has no application element: {merged}")
    if application is not None:
        require(application.get(ANDROID_NS + "allowBackup") == "false", "Merged release manifest does not disable backup.")
        require(application.get(ANDROID_NS + "fullBackupContent") == "@xml/backup_rules", "Merged release manifest lost legacy backup rules.")
        require(application.get(ANDROID_NS + "dataExtractionRules") == "@xml/data_extraction_rules", "Merged release manifest lost extraction rules.")

    uses_permissions = {
        node.get(ANDROID_NS + "name")
        for node in root_xml.findall("uses-permission")
        if node.get(ANDROID_NS + "name")
    }

    allowed_permissions = {
        "android.permission.INTERNET",
        f"{APP_ID}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION",
    }
    unexpected = sorted(uses_permissions - allowed_permissions)
    require(not unexpected, f"Unexpected merged release permissions: {unexpected}")

    print(f"Merged release manifest: {merged}")
    print("Merged release permissions:")
    for permission in sorted(uses_permissions):
        print(f"- {permission}")

if failures:
    print(f"HARNESS native production audit failed ({len(failures)}):", file=sys.stderr)
    for failure in failures:
        print(f"- {failure}", file=sys.stderr)
    raise SystemExit(1)

print("HARNESS native production audit passed: approved app ID, no-backup policy, release manifest and permission allowlist.")
