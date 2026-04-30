import { ZodError, ZodObject, ZodRawShape, z } from "zod";
import { ValidationError } from "./error.js";

export function validate<T extends ZodObject<any>>(schema: T, data: unknown) {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new ValidationError("Validation failed", formattedErrors);
    }
    throw error;
  }
}

export function validatePartial<T extends ZodObject<any>>(
  schema: T,
  data: unknown,
) {
  try {
    return schema.partial().parse(data) as Partial<z.infer<T>>;
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new ValidationError("Validation failed", formattedErrors);
    }
    throw error;
  }
}
