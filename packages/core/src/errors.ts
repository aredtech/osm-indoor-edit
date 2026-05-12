export class OsmIndoorError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class DataIntegrityError extends OsmIndoorError {
  constructor(message: string) {
    super(message, "DATA_INTEGRITY_ERROR");
  }
}

export class UnsupportedOperationError extends OsmIndoorError {
  constructor(operation: string) {
    super(`${operation} is not supported in this phase`, "UNSUPPORTED_OPERATION");
  }
}

