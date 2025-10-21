export function setPersistence(persistence_: {
    bindState: (arg0: string, arg1: WSSharedDoc) => void;
    writeState: (arg0: string, arg1: WSSharedDoc) => Promise<any>;
    provider: any;
} | null): void;
export function getPersistence(): null | {
    bindState: (arg0: string, arg1: WSSharedDoc) => void;
    writeState: (arg0: string, arg1: WSSharedDoc) => Promise<any>;
} | null;
/**
 * @type {Map<string,WSSharedDoc>}
 */
export const docs: Map<string, WSSharedDoc>;
export function setContentInitializor(f: (ydoc: Y.Doc) => Promise<void>): void;
export class WSSharedDoc extends Y.Doc {
    /**
     * @param {string} name
     */
    constructor(name: string);
    name: string;
    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     * @type {Map<Object, Set<number>>}
     */
    conns: Map<any, Set<number>>;
    /**
     * @type {awarenessProtocol.Awareness}
     */
    awareness: awarenessProtocol.Awareness;
    whenInitialized: Promise<void>;
}
export function getYDoc(docname: string, gc?: boolean): WSSharedDoc;
export function setupWSConnection(conn: import('ws').WebSocket, req: import('http').IncomingMessage, { docName, gc }?: any): void;
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
