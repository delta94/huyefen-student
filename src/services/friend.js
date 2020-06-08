/* eslint-disable */
import { apiGet, apiPut } from '@/utils/request';

export async function fetchFriends(page = 1, limit = 9) {
    return apiGet(`${FRIEND_API_URL}/me?page=${page}&limit=${limit}`);
}

export async function allFriends(existed) {
    return apiGet(`${FRIEND_API_URL}/me/all?existed=${existed}`);
}