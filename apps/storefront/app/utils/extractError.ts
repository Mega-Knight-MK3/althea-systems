export function extractFirstError(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null

  const response = (err as { response?: { _data?: unknown } }).response
  const data = response?._data as
    | { message?: string; errors?: Array<{ message: string }> }
    | undefined

  if (data?.errors && data.errors.length > 0) return data.errors[0]!.message
  if (data?.message) return data.message
  return null
}
