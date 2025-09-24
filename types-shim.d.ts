declare module 'twilio-video' {
  import type { EventEmitter } from 'events';
  export type LocalTrack = any;
  export type RemoteTrack = any;
  export type RemoteTrackPublication = any;
  export type RemoteVideoTrack = any;
  export type RemoteAudioTrack = any;
  export interface Room extends EventEmitter {
    participants: Map<string, any>;
    disconnect(): void;
    on(event: 'participantConnected' | 'disconnected', listener: (...args: any[]) => void): this;
  }
  export interface LocalVideoTrack {
    kind: 'video';
    isEnabled: boolean;
    attach(element: HTMLVideoElement): void;
    detach(element?: HTMLVideoElement): void;
    stop(): void;
    enable(): void;
    disable(): void;
  }
  export interface LocalAudioTrack {
    kind: 'audio';
    isEnabled: boolean;
    attach?(element?: HTMLAudioElement): void;
    detach?(element?: HTMLAudioElement): void;
    stop(): void;
    enable(): void;
    disable(): void;
  }
  export interface RemoteParticipant extends EventEmitter {
    tracks: Map<string, RemoteTrackPublication>;
    on(event: 'trackSubscribed', listener: (track: RemoteTrack) => void): this;
  }
  export function createLocalTracks(opts?: { audio?: boolean; video?: boolean }): Promise<LocalTrack[]>;
  export default class VideoCls {
    static connect(token: string, options: { name: string; tracks: LocalTrack[] }): Promise<Room>;
  }
}

declare module '@twilio/conversations' {
  export class Client {
    static create(token: string): Promise<Client>;
    getConversationBySid(sid: string): Promise<Conversation>;
    shutdown(): void;
  }
  export interface Message {
    sid: string;
    author?: string;
    body?: string;
    dateCreated: Date;
    type?: 'text' | 'media';
    media?: { getContentTemporaryUrl(): Promise<string> };
  }
  export interface Conversation {
    sid: string;
    getMessages(): Promise<{ items: Message[] }>;
    sendMessage(body: string | FormData, attributes?: Record<string, any>): Promise<void>;
    on(event: 'messageAdded' | 'typingStarted' | 'typingEnded', listener: (...args: any[]) => void): void;
    removeListener(event: 'messageAdded' | 'typingStarted' | 'typingEnded', listener: (...args: any[]) => void): void;
    typing(): void;
  }
  export interface Participant { identity?: string }
}