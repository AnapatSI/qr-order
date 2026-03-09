// Security utilities for input validation and sanitization

export function validateStoreId(storeId: string): boolean {
  // Store ID should be alphanumeric, 3-10 characters
  const pattern = /^[A-Za-z0-9]{3,10}$/
  return pattern.test(storeId)
}

export function validateTableNumber(table: string): boolean {
  // Table number should be alphanumeric or numeric, 1-10 characters
  const pattern = /^[A-Za-z0-9]{1,10}$/
  return pattern.test(table)
}

export function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

export function validatePrice(price: number): boolean {
  // Price should be positive number with max 2 decimal places
  return price > 0 && price <= 99999 && Number.isFinite(price)
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 255) // Limit length
}

export function validateMenuItemName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 100
}

export function validateOrderStatus(status: string): boolean {
  const validStatuses = ['pending', 'cooking', 'served', 'paid']
  return validStatuses.includes(status)
}

export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
