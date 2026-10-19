export class ConvexError extends Error {
  constructor(public data: { message: string }) {
    super(data.message);
  }
}
