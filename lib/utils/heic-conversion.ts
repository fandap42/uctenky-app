export async function convertHeicBufferToJpeg(input: Uint8Array): Promise<Buffer> {
  const heicConvert = (await import("heic-convert")).default

  const output = await heicConvert({
    buffer: input,
    format: "JPEG",
    quality: 0.95,
  })

  if (Buffer.isBuffer(output)) {
    return output
  }

  if (output instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(output))
  }

  return Buffer.from(output)
}
