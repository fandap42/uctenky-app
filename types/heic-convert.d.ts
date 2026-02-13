declare module "heic-convert" {
  type HeicConvertParams = {
    buffer: Uint8Array
    format: "JPEG" | "PNG"
    quality?: number
  }

  type HeicConvert = (params: HeicConvertParams) => Promise<Uint8Array | ArrayBuffer>

  const heicConvert: HeicConvert
  export default heicConvert
}
