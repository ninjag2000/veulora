import c1 from "./chunk01.ts";
import c2 from "./chunk02.ts";
import c3 from "./chunk03.ts";
import c4 from "./chunk04.ts";
import c5 from "./chunk05.ts";
import c6 from "./chunk06.ts";

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function gunzipToText(bytes: Uint8Array) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

const sourceBase64 = [c1, c2, c3, c4, c5, c6].join("");
const source = await gunzipToText(base64ToBytes(sourceBase64));
await import(`data:application/typescript;base64,${btoa(source)}`);