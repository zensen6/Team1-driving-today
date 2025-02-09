import {useCallback, useEffect, useRef, useState} from 'react'

import {apiCall} from '@/utils/api'
import {sessionProvider} from '@/utils/session'

export interface ChatRoomEnterResponse {
  chatRoomInfo: ChatRoomInfo | undefined | null
  chatMessageList: ChatMessageHistory[] | null
}

export interface ChatRoomInfo {
  roomId: number
  studentId: number
  instructorId: number
}

type ChatMessage = {
  type: 'ENTER' | 'TALK' | 'QUIT'
  userId: number
  userType: 'INSTRUCTOR' | 'STUDENT'
  roomId: number
  message: string
  timestamp?: number
}

export type ChatMessageHistory = ChatMessage & {
  timestamp: number
  id: string
}

export type UseChatSocketReturn = ChatRoomEnterResponse & {
  isReady: boolean
  handleSendMessage: ({
    userId,
    userType,
    message,
  }: {
    userId: number
    userType: 'INSTRUCTOR' | 'STUDENT'
    message: string
  }) => void
  handleQuitRoom: () => void
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
const chatEnterApiMap = {
  STUDENT: '/chat/student/enter',
  INSTRUCTOR: '/chat/instructor/enter',
}
export function useChatSocket(id: number): UseChatSocketReturn {
  const [chatRoomInfo, setChatRoomInfo] = useState<ChatRoomEnterResponse['chatRoomInfo']>()
  const [messages, setMessages] = useState<ChatMessageHistory[] | null>(null)
  const socketRef = useRef<WebSocket>()
  const [isReady, setIsReady] = useState(false)

  if (!sessionProvider.session) throw new Error('no seesion')
  const role = sessionProvider.session.role

  const handleQuitRoom = useCallback(() => {
    if (!chatRoomInfo) return
    const msg: ChatMessage = {
      type: 'QUIT',
      roomId: chatRoomInfo.roomId,
      message: '',
      userId: id,
      userType: role,
    }
    socketRef.current?.send(JSON.stringify(msg))
    socketRef.current?.close()
  }, [id, role, chatRoomInfo])

  const handleSendMessage = useCallback(
    ({
      userId,
      userType,
      message,
    }: {
      userId: number
      userType: 'INSTRUCTOR' | 'STUDENT'
      message: string
    }) => {
      if (!chatRoomInfo) return
      const msg: ChatMessage = {
        type: 'TALK',
        roomId: chatRoomInfo?.roomId,
        message: message,
        userId,
        userType,
        timestamp: new Date().getTime(),
      }
      socketRef.current?.send(JSON.stringify(msg))
    },
    [chatRoomInfo],
  )

  useEffect(() => {
    const abortController = new AbortController()
    const path = chatEnterApiMap[role]
    const body = role === 'INSTRUCTOR' ? {studentId: id} : {instructorId: id}
    apiCall(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'},
      signal: abortController.signal,
    })
      .then((res: Response) => res.json())
      .then((res: ChatRoomEnterResponse) => {
        setChatRoomInfo(res.chatRoomInfo)
        setMessages(res.chatMessageList)
      })
    return () => {
      abortController.abort()
    }
  }, [id, role])

  useEffect(() => {
    if (socketRef.current || !chatRoomInfo) return
    socketRef.current = new WebSocket(`${SOCKET_URL}/ws/chat`, sessionProvider.getAccessToken())
    socketRef.current.onopen = () => {
      const msg: ChatMessage = {
        type: 'ENTER',
        roomId: chatRoomInfo.roomId,
        userId: id,
        userType: role,
        message: '',
      }
      socketRef.current?.send(JSON.stringify(msg))
      setIsReady(true)
    }
    socketRef.current.onmessage = (e: MessageEvent) => {
      const message = JSON.parse(e.data)
      if (message.type !== 'TALK') return
      setMessages((prev) => {
        if (prev === null) return [message]
        return [...prev, message]
      })
    }
    socketRef.current.onerror = console.error
    socketRef.current.onclose = () => {
      setIsReady(false)
    }

    return () => {
      handleQuitRoom()
    }
  }, [id, role, chatRoomInfo, handleQuitRoom])

  return {chatRoomInfo, chatMessageList: messages, isReady, handleQuitRoom, handleSendMessage}
}
