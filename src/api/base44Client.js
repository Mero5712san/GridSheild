import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const isValidAppId = typeof appId === 'string'
    ? appId.trim() !== '' && appId.trim().toLowerCase() !== 'null' && appId.trim().toLowerCase() !== 'undefined'
    : Boolean(appId);

const unsupportedAuthCall = async () => {
    throw new Error('Base44 appId is not configured');
}

//Create a client with authentication required
export const base44 = isValidAppId
    ? createClient({
        appId,
        token,
        functionsVersion,
        serverUrl: '',
        requiresAuth: false,
        appBaseUrl
    })
    : {
        auth: {
            me: unsupportedAuthCall,
            logout: () => {
                // no-op for self-hosted mode
            },
            redirectToLogin: () => {
                // no-op for self-hosted mode
            },
        }
    };
