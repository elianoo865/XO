import { httpsCallable } from "firebase/functions";
import { functions } from "./init";

export const fnCreatePrivateRoom = httpsCallable(functions, "createPrivateRoom");
export const fnJoinPrivateRoom = httpsCallable(functions, "joinPrivateRoom");
export const fnEnqueueMatchmaking = httpsCallable(functions, "enqueueMatchmaking");
export const fnMakeMove = httpsCallable(functions, "makeMove");
export const fnRequestRematch = httpsCallable(functions, "requestRematch");
export const fnLeaveRoom = httpsCallable(functions, "leaveRoom");
