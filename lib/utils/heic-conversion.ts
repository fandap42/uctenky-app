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

  const arrayBuffer = output instanceof ArrayBuffer ? output : output.buffer
  return Buffer.from(new Uint8Array(arrayBuffer))
}
