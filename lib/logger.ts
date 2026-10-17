import pino from "pino"

const isProduction = process.env.NODE_ENV === "production"
const isTest = process.env.NODE_ENV === "test"

export const REDACT_PATHS = [
  "password",
  "*.password",
  "passwordHash",
  "*.passwordHash",
  "newPassword",
  "*.newPassword",
  "bankAccountNumber",
  "*.bankAccountNumber",
  "bankAccountPrefix",
  "*.bankAccountPrefix",
  "accountNumber",
  "*.accountNumber",
  "prefix",
  "*.prefix",
  "headers.authorization",
  "headers.cookie",
  "req.headers.authorization",
  "req.headers.cookie",
]

export function createLogger(
  options?: pino.LoggerOptions,
  destination?: pino.DestinationStream
) {
  const baseOptions: pino.LoggerOptions = {
    level:
      process.env.LOG_LEVEL ||
      (isTest ? "silent" : isProduction ? "info" : "debug"),
    redact: {
      paths: REDACT_PATHS,
      censor: "[Redacted]",
    },
    base: {
      env: process.env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(!isProduction && !isTest && !destination
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        }
      : {}),
    ...options,
  }

  return destination ? pino(baseOptions, destination) : pino(baseOptions)
}

export const logger = createLogger()
