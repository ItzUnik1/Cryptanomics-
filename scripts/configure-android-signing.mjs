import { readFile, writeFile } from "node:fs/promises";

const env = process.env;
if (!env.ANDROID_SIGNING_CONFIG) {
  throw new Error("Missing repository secret ANDROID_SIGNING_CONFIG. Add the JSON signing configuration described in BUILDING.md.");
}
const config = JSON.parse(env.ANDROID_SIGNING_CONFIG);
for (const key of ["keystoreBase64", "storePassword", "keyAlias", "keyPassword"]) {
  if (!config[key]) throw new Error(`ANDROID_SIGNING_CONFIG is missing ${key}`);
}
const keystorePath = "/tmp/cryptanomics-release.p12";
await writeFile(keystorePath, Buffer.from(config.keystoreBase64, "base64"));
const githubEnv = env.GITHUB_ENV;
if (!githubEnv) throw new Error("GITHUB_ENV is not available.");
await writeFile(githubEnv, [
  `ANDROID_KEYSTORE_PATH=${keystorePath}`,
  `ANDROID_KEYSTORE_PASSWORD=${config.storePassword}`,
  `ANDROID_KEY_ALIAS=${config.keyAlias}`,
  `ANDROID_KEY_PASSWORD=${config.keyPassword}`,
  ""
].join("\n"), { flag: "a" });

const gradlePath = "android/app/build.gradle";
let gradle = await readFile(gradlePath, "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const [major, minor, patch] = packageJson.version.split(".").map(Number);
const versionCode = major * 10000 + minor * 100 + patch;
gradle = gradle.replace(/versionCode\\s+\\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\\s+"[^"]+"/, `versionName "${packageJson.version}"`);
if (!gradle.includes("signingConfigs")) {
  const marker = "    buildTypes {";
  if (!gradle.includes(marker)) throw new Error("Could not locate Android buildTypes block.");
  gradle = gradle.replace(marker, `    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }

${marker}`);
}
const buildTypesAt = gradle.indexOf("    buildTypes {");
const releaseAt = gradle.indexOf("        release {", buildTypesAt);
if (releaseAt < 0) throw new Error("Could not locate Android release build type.");
const insertion = releaseAt + "        release {".length;
if (!gradle.slice(insertion, insertion + 150).includes("signingConfig")) {
  gradle = gradle.slice(0, insertion) + "\n            signingConfig signingConfigs.release" + gradle.slice(insertion);
}
await writeFile(gradlePath, gradle);
console.log("Configured stable CRYPTANOMICS release signing.");
