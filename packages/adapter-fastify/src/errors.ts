export class ValidationError extends Error {
  readonly statusCode = 400
  readonly issues: string[]

  constructor(message: string, issues: string[]) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = 'ValidationError'
    this.issues = issues
  }
}
