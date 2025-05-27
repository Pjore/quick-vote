import Cookies from "js-cookie"

// Get session ID from client-side cookies
export function getClientSessionId(): string {
  return Cookies.get("user_session_id") || ""
}
