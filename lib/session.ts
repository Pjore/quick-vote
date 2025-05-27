"use client"

import { v4 as uuidv4 } from "uuid"
import Cookies from "js-cookie"

const SESSION_COOKIE_NAME = "lightning_talk_session_id"

export const getSessionId = (): string => {
  let sessionId = Cookies.get(SESSION_COOKIE_NAME)

  if (!sessionId) {
    sessionId = uuidv4()
    // Set cookie to expire in 30 days
    Cookies.set(SESSION_COOKIE_NAME, sessionId, { expires: 30 })
  }

  return sessionId
}
