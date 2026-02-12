import type { Buffer } from "buffer"

export async function convertHeicBufferToJpeg(input: Buffer): Promise<Buffer> {
  const heicConvert = (await import("heic-convert")).default

  const output = await heicConvert({
    buffer: input,
    format: "JPEG",
    quality: 0.95,
  })

  return Buffer.isBuffer(output) ? output : Buffer.from(output)
}
