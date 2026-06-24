declare module "pdf-parse" {
  function pdfParse(dataBuffer: Buffer, options?: object): Promise<{ text: string; numpages: number; info: object }>;
  export = pdfParse;
}

declare module "officeparser" {
  function parseOfficeAsync(
    data: Buffer | string,
    callback: (data: string, err: Error) => void,
    config?: object
  ): void;
  export { parseOfficeAsync };
}
