package com.demo.admin.common.websocket;

import cn.hutool.json.JSONUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 通知WebSocket处理器 - 支持向所有在线用户推送通知
 */
public class NoticeWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(NoticeWebSocketHandler.class);

    /**
     * 在线会话集合 sessionId -> session
     */
    private static final Map<String, WebSocketSession> SESSIONS = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        SESSIONS.put(session.getId(), session);
        log.info("WebSocket连接建立: {}, 在线数: {}", session.getId(), SESSIONS.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        SESSIONS.remove(session.getId());
        log.info("WebSocket连接关闭: {}, 在线数: {}", session.getId(), SESSIONS.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 客户端心跳 ping -> pong
        if ("ping".equals(message.getPayload())) {
            try {
                session.sendMessage(new TextMessage("pong"));
            } catch (IOException e) {
                log.error("发送pong失败", e);
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        SESSIONS.remove(session.getId());
    }

    /**
     * 向所有在线用户广播消息
     */
    public static void broadcast(String type, Object data) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", type);
        msg.put("data", data);
        String json = JSONUtil.toJsonStr(msg);
        TextMessage message = new TextMessage(json);
        SESSIONS.values().forEach(session -> {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException e) {
                    log.error("广播消息失败: {}", session.getId(), e);
                }
            }
        });
    }

    /**
     * 获取在线连接数
     */
    public static int getOnlineCount() {
        return SESSIONS.size();
    }
}
