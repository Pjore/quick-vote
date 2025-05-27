import { neon } from "@neondatabase/serverless"

// Create a SQL client with the connection string from environment variables
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute a query and return the results
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
  try {
    // Use sql.query for conventional function calls with placeholders
    return (await sql.query(queryString, params)) as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
