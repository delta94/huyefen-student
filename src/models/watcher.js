import { EffectWithType } from '@/config/constants';
import { requestPermission, subscribeMessaging, unSubscribeMessaging, getFCMToken } from '@/utils/firebase/messaging';
import storage from '@/utils/storage';
import _ from 'lodash';
import { notification as notificationPopup, Icon } from 'antd';
import { mapNotificationTypeToTitle } from '@/utils/utils';
import UserAvatar from '@/components/avatar';

export default {
    namespace: 'watcher',
    state: null,
    effects: {
        *notification({ payload }, { call, put, select }) {
            const { data } = payload;
            const {
                _id,
                ownerType,
                ownerId,
                ownerName,
                ownerAvatar,
                pushType
            } = data;
            let icon;
            if (ownerId)
                icon = (
                    <UserAvatar
                        src={ownerAvatar}
                        alt='user-avatar'
                        borderWidth={1}
                        size={32}
                        textSize={33}
                        text={ownerName}
                        style={{ color: 'white', background: '#FADA5E', fontSize: '0.7em' }}
                    />
                );
            else if (pushType === 'messenger')
                icon = <Icon type="mail" style={{ fontSize: '24px', color: '#FADA5E' }} />;
            else
                icon = <Icon type="bell" style={{ fontSize: '24px', color: '#FADA5E' }} />;
            if (pushType === 'messenger') {
                const { converId, text, image, video, unseen } = data;
                let notificationContent = '';
                if (ownerType === 'Teacher')
                    notificationContent = 'Giáo viên ';
                else if (ownerType === 'Admin')
                    notificationContent = 'Quản trị viên ';
                if (video)
                    notificationContent += `${ownerName} đã tải lên một video.`;
                else if (image)
                    notificationContent += `${ownerName} đã tải lên một hình ảnh.`;
                else
                    notificationContent += `${ownerName} đã nhắn "${text}"`;
                notificationPopup.open({
                    key: converId + _.uniqueId('di_'),
                    icon,
                    message: `${mapNotificationTypeToTitle('messenger')}`,
                    description: notificationContent,
                    placement: "topLeft"
                });
                let lastMessage;
                if (video)
                    lastMessage = 'Đã tải lên một video.';
                else if (image)
                    lastMessage = 'Đã tải lên một hình ảnh.';
                else
                    lastMessage = text;
                const conversation = {
                    _id: converId,
                    lastUpdated: data.createdAt,
                    lastMessage,
                    unseen: Number(unseen),
                    name: `${ownerName}`,
                    avatar: ownerAvatar
                };
                yield put({
                    type: 'messenger/shift',
                    payload: conversation
                });
                yield put({
                    type: 'messages/shift',
                    payload: conversation
                });
                const noOfUsMessage = yield select(state => state.user.noOfUsMessage);
                yield put({
                    type: 'user/saveNoUsMessage',
                    payload: noOfUsMessage + 1
                });
            }
            else {
                let content = data.content;
                if (ownerId)
                    content = `${ownerType === 'Teacher' ? 'Giáo viên ' : ownerType === 'Admin' ? 'Quản trị viên ' : ''}${ownerName} ${content}`;
                notificationPopup.open({
                    key: _id,
                    icon,
                    message: `${mapNotificationTypeToTitle(data.type)}`,
                    description: content,
                    placement: "topLeft"
                });
                const noOfUsNotification = yield select(state => state.user.noOfUsNotification);
                const notificationItem = _.omit(data, ['ownerId', 'ownerName', 'ownerAvatar', 'pushType']);
                notificationItem.owner = null;
                if (ownerId) {
                    notificationItem.owner = {
                        _id: ownerId,
                        name: ownerName,
                        avatar: ownerAvatar
                    };
                }
                yield put({
                    type: 'notifications/shift',
                    payload: notificationItem
                });
                yield put({
                    type: 'user/saveNoUsNotification',
                    payload: noOfUsNotification + 1
                });
            }
        },
        firebaseRegisterWatcher: [
            function*({ take, fork, cancel, call, put }) {
                let enablePushServiceInterval = null;
                let dispatch = window.g_app._store.dispatch;
                while (yield take(['user/fetch/@@end', 'user/login/@@end'])) {
                    const registerTask = yield fork(fcmRegisterTask);
                    yield take('user/logout');
                    yield cancel(registerTask);
                    yield fork(fcmUnregisterTask);
                }

                function onSaveTokenCallback(newToken) {
                    dispatch({
                        type: 'fcm/saveToken',
                        payload: newToken
                    });
                }

                function onMessageCallback(payload) {
                    dispatch({
                        type: 'watcher/notification',
                        payload
                    });
                }

                function onGetTokenErrorCallback(err) {
                    notificationPopup.error({
                        message: 'Firebase get token error',
                        description: err.message
                    });
                }

                function onDeleteTokenErrorCallback(err) {
                    notificationPopup.error({
                        message: 'Firebase delete token error',
                        description: err.message
                    });
                }

                function* fcmRegisterTask() {
                    const permission = yield call(requestPermission);
                    if (!permission) {
                        if (enablePushServiceInterval)
                            clearInterval(enablePushServiceInterval);
                        enablePushServiceInterval = setInterval(() => {
                            notificationPopup.warn({
                                message: 'Bật thông báo',
                                description: 'Bật thông báo để không bỏ lỡ những tin nhắn của hệ thống.'
                            });
                        }, 50000);
                    }
                    else {
                        subscribeMessaging({
                            onMessageCallback,
                            onSaveTokenCallback
                        });
                        const token = yield call(getFCMToken, onGetTokenErrorCallback);
                        onSaveTokenCallback(token);
                    }
                }

                function* fcmUnregisterTask() {
                    if (enablePushServiceInterval) {
                        clearInterval(enablePushServiceInterval);
                        enablePushServiceInterval = null;
                    }
                    const token = storage.getFCMToken();
                    if (token) {
                        yield call(unSubscribeMessaging, token, onDeleteTokenErrorCallback);
                        storage.setFCMToken();
                    }
                }
            },
            EffectWithType.WATCHER
        ]
    }
}
