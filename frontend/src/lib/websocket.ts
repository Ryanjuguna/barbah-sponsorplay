/* ============================================================================
   DHAMINI — WebSocket Client
   Real-time stream verification updates (Agent 3 Proof-of-Play)
   
   Backend contract (to be implemented on FastAPI side):
   
   Endpoint:   WSS://barbah-sponsorplay.onrender.com/api/v1/ws/verify/{creator_id}
   Protocol:   JSON messages, text frames
   
   Client → Server (subscribe):
   {
     type: "subscribe",
     stream_url: "https://twitch.tv/creator_channel",
     proposal_id: "PROP-xxx",
     milestone_id: "MLS-xxx"
   }
   
   Server → Client (verification updates):
   {
     type: "verification_update",
     milestone_id: "MLS-xxx",
     status: "IN_PROGRESS" | "VERIFIED" | "REQUIRES_REVISION" | "FAILED",
     logo_screen_ratio_percent: 4.12,
     verbal_slogans_detected: ["Powered by Safaricom 5G"],
     audio_confidence: 0.95,
     brand_safety_status: "SAFE",
     overall_confidence_percent: 96.5,
     verification_decision: "PASSED",
     cryptographic_hash: "...",
     timestamp: "2026-11-21T..."
   }
   
   Server → Client (heartbeat):
   { type: "ping", timestamp: "..." }
   
   Client → Server (respond to heartbeat):
   { type: "pong", timestamp: "..." }
   
   SIMULATION MODE:
   When the backend WebSocket endpoint is not yet available, the client falls
   back to a simulated verification stream so the creator journey can be demoed
   end-to-end. Set VITE_WS_SIMULATE=true in .env to force simulation.
   ============================================================================ */

export type VerifyStatus =
  | "IN_PROGRESS"
  | "VERIFIED"
  | "REQUIRES_REVISION"
  | "FAILED";

export interface VerificationUpdate {
  type: "verification_update";
  milestone_id: string;
  status: VerifyStatus;
  logo_screen_ratio_percent?: number;
  verbal_slogans_detected?: string[];
  audio_confidence?: number;
  brand_safety_status?: string;
  overall_confidence_percent?: number;
  verification_decision?: string;
  cryptographic_hash?: string;
  timestamp: string;
}

export interface WSSubscribePayload {
  type: "subscribe";
  stream_url: string;
  proposal_id: string;
  milestone_id: string;
}

export interface WSMessage {
  type: string;
  [key: string]: any;
}

type UpdateHandler = (update: VerificationUpdate) => void;
type ErrorHandler = (error: Event) => void;
type ConnectHandler = () => void;
type DisconnectHandler = () => void;

/* ---- Simulation helpers ---- */

const SIMULATE = import.meta.env.VITE_WS_SIMULATE === "true";

const simulateUpdates = (
  onUpdate: (update: VerificationUpdate) => void,
  milestoneId: string
) => {
  const stages: VerificationUpdate[] = [
    {
      type: "verification_update",
      milestone_id: milestoneId,
      status: "IN_PROGRESS",
      logo_screen_ratio_percent: 0.5,
      audio_confidence: 0.3,
      brand_safety_status: "SCANNING",
      overall_confidence_percent: 30,
      timestamp: new Date().toISOString(),
    },
    {
      type: "verification_update",
      milestone_id: milestoneId,
      status: "IN_PROGRESS",
      logo_screen_ratio_percent: 2.1,
      verbal_slogans_detected: ["Powered by Safaricom 5G"],
      audio_confidence: 0.72,
      brand_safety_status: "SAFE",
      overall_confidence_percent: 68,
      timestamp: new Date().toISOString(),
    },
    {
      type: "verification_update",
      milestone_id: milestoneId,
      status: "IN_PROGRESS",
      logo_screen_ratio_percent: 3.8,
      verbal_slogans_detected: ["Powered by Safaricom 5G"],
      audio_confidence: 0.88,
      brand_safety_status: "SAFE",
      overall_confidence_percent: 84,
      timestamp: new Date().toISOString(),
    },
    {
      type: "verification_update",
      milestone_id: milestoneId,
      status: "VERIFIED",
      logo_screen_ratio_percent: 4.12,
      verbal_slogans_detected: ["Powered by Safaricom 5G", "Safaricom community gaming den"],
      audio_confidence: 0.95,
      brand_safety_status: "SAFE",
      overall_confidence_percent: 96.5,
      verification_decision: "PASSED",
      cryptographic_hash: "POP-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      timestamp: new Date().toISOString(),
    },
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < stages.length) {
      onUpdate(stages[i]);
      i++;
    } else {
      clearInterval(interval);
    }
  }, 2500);

  return () => clearInterval(interval);
};

class VerificationWebSocket {
  private ws: WebSocket | null = null;
  private url: string = "";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private heartbeatInterval: ReturnType<typeof setTimeout> | null = null;
  private simulationInterval: (() => void) | null = null;
  private handlers = {
    onUpdate: new Set<UpdateHandler>(),
    onError: new Set<ErrorHandler>(),
    onConnect: new Set<ConnectHandler>(),
    onDisconnect: new Set<DisconnectHandler>(),
  };
  private isSimulating = false;

  connect(creatorId: string, token?: string) {
    if (SIMULATE) {
      this.startSimulation();
      this.handlers.onConnect.forEach((h) => h());
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = "barbah-sponsorplay.onrender.com";
    this.url = `${protocol}//${host}/api/v1/ws/verify/${creatorId}`;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.handlers.onConnect.forEach((h) => h());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        if (message.type === "verification_update") {
          this.handlers.onUpdate.forEach((h) => h(message as VerificationUpdate));
        } else if (message.type === "ping") {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    this.ws.onerror = (event: Event) => {
      this.handlers.onError.forEach((h) => h(event));
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.handlers.onDisconnect.forEach((h) => h());
      this.attemptReconnect(creatorId, token);
    };
  }

  private startSimulation() {
    this.isSimulating = true;
    this.handlers.onConnect.forEach((h) => h());
  }

  startSimulationStream(onUpdate: (update: VerificationUpdate) => void, milestoneId: string) {
    if (!this.isSimulating) return;
    this.simulationInterval = simulateUpdates(onUpdate, milestoneId);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      this.simulationInterval();
      this.simulationInterval = null;
    }
    this.isSimulating = false;
  }

  private attemptReconnect(creatorId: string, token?: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`WebSocket reconnect attempt ${this.reconnectAttempts}`);
        this.connect(creatorId, token);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  subscribe(payload: WSSubscribePayload) {
    if (SIMULATE) {
      // Simulation starts when the component calls subscribe via startSimulationStream
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket not open, cannot subscribe");
    }
  }

  unsubscribe() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "unsubscribe" }));
    }
  }

  disconnect() {
    this.stopHeartbeat();
    this.stopSimulation();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onUpdate(handler: UpdateHandler) {
    this.handlers.onUpdate.add(handler);
    return () => this.handlers.onUpdate.delete(handler);
  }

  onError(handler: ErrorHandler) {
    this.handlers.onError.add(handler);
    return () => this.handlers.onError.delete(handler);
  }

  onConnect(handler: ConnectHandler) {
    this.handlers.onConnect.add(handler);
    return () => this.handlers.onConnect.delete(handler);
  }

  onDisconnect(handler: DisconnectHandler) {
    this.handlers.onDisconnect.add(handler);
    return () => this.handlers.onDisconnect.delete(handler);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || this.isSimulating;
  }
}

export const verificationWS = new VerificationWebSocket();
export default verificationWS;