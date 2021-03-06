import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import moment from 'moment';
import { connect } from 'dva';
import { formatMessage } from 'umi-plugin-react/locale';
import router from 'umi/router';
import { Popover, List, Badge, Avatar, Icon, Empty, Spin as Loading } from 'antd';
import UserAvatar from '@/components/Avatar';
import { Scrollbars } from 'react-custom-scrollbars';
import Spin from '@/elements/spin/secondary';
import { fromNow, truncate } from '@/utils/utils';
import styles from './index.less';

const Notifications = ({ dispatch, ...props }) => {
  const scrollEleRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    return () =>
      dispatch({
        type: 'notifications/reset',
      });
  }, []);
  const getContent = () => {
    const { notifications, loading, initLoading, maskLoading } = props;

    const content =
      notifications === null || _.isEmpty(notifications) ? (
        <div className={styles.empty}>
          <div className={styles.inlineDiv}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={formatMessage({ id: 'header.notifications.empty' })}
            />
          </div>
        </div>
      ) : (
        <Scrollbars
          ref={scrollEleRef}
          autoHeight
          autoHeightMax={474}
          onScroll={handleScroll}
          className={styles.scrollEle}
        >
          <List
            dataSource={notifications}
            rowKey={item => item._id}
            renderItem={item => (
              <div className={styles.notiItem} onClick={() => handleViewNotify(item)}>
                <List.Item
                  style={{ background: item.seen ? 'inherit' : 'rgba(250, 218, 94, 0.05)' }}
                >
                  <List.Item.Meta
                    avatar={
                      item.owner ? (
                        <UserAvatar
                          size={36}
                          textSize={36}
                          style={{ background: '#FADA5E', color: 'white' }}
                          src={item.owner.avatar}
                          text={item.owner.name}
                          alt="user-avatar"
                          borderWidth={0}
                        />
                      ) : null
                    }
                    title={
                      <span>
                        {item.owner
                          ? truncate(
                              `${
                                item.ownerType === 'Teacher'
                                  ? 'GV '
                                  : item.ownerType === 'Admin'
                                  ? 'Admin '
                                  : ''
                              }${item.owner.name} ${item.content}`,
                              92,
                            )
                          : ''}
                      </span>
                    }
                    description={
                      <span style={{ fontSize: 13, color: 'gray' }}>
                        {fromNow(moment(item.createdAt))}
                      </span>
                    }
                  />
                </List.Item>
              </div>
            )}
          />
          {loading && (
            <div className={styles.oldLoading}>
              <Loading indicator={<Icon type="loading" style={{ fontSize: 18 }} spin />} />
            </div>
          )}
        </Scrollbars>
      );
    return (
      <Spin spinning={maskLoading || initLoading || notifications === null} fontSize={8} isCenter>
        <div>{content}</div>
        <div className={styles.viewAll} onClick={handleViewAll}>
          {formatMessage({ id: 'header.notifications.viewall' })}
        </div>
      </Spin>
    );
  };

  const handleVisibleChange = visible => {
    const { notifications, initLoading } = props;
    setVisible(visible);
    if (visible && !notifications && !initLoading) {
      dispatch({
        type: 'notifications/fetch',
      });
    } else if (!visible) {
      if (scrollEleRef.current) scrollEleRef.current.scrollToTop();
    }
  };

  const handleScroll = e => {
    const { initLoading, loading, hasMore } = props;
    const element = e.srcElement;
    if (element.scrollTop === element.scrollHeight - 474) {
      if (!initLoading && !loading && hasMore)
        dispatch({
          type: 'notifications/more',
        });
    }
  };

  const handleViewAll = () => {
    handleVisibleChange(false);
    router.push('/notifications');
  };

  const handleViewNotify = item => {
    let url = '';
    switch (item.type) {
      case 'friend':
        url = `/friend/${item.owner._id}`;
        break;
      case 'recommend':
        url = `/course/${item.course}`;
        break;
      default:
        url = '/';
    }
    router.push(url);
    handleVisibleChange(false);
    if (!item.seen)
      dispatch({
        type: 'notifications/read',
        payload: item._id,
      });
  };

  const { unseen } = props;
  let count = 0;
  if (unseen > 0)
    count = (
      <Avatar style={{ background: 'purple', fontSize: '11px' }} size={16}>
        {unseen > 99 ? '99+' : unseen}
      </Avatar>
    );
  const trigger = (
    <span className={styles.trigger}>
      <Badge count={count} style={{ boxShadow: 'none' }} className={styles.badge} overflowCount={9}>
        <Icon type="bell" style={{ fontSize: 18 }} />
      </Badge>
    </span>
  );
  const content = getContent();
  if (!content) return trigger;
  return (
    <Popover
      placement="bottomRight"
      content={content}
      popupClassName={styles.popover}
      trigger="click"
      arrowPointAtCenter
      popupAlign={{ offset: [20, 10] }}
      onVisibleChange={handleVisibleChange}
      visible={visible}
    >
      {trigger}
    </Popover>
  );
};

export default connect(({ notifications, loading, user }) => ({
  loading: !!loading.effects['notifications/more'],
  initLoading: !!loading.effects['notifications/fetch'],
  maskLoading: !!loading.effects['notifications/maskAllAsRead'],
  hasMore: notifications.hasMore,
  notifications: notifications.list,
  unseen: user.noOfUsNotification,
}))(Notifications);
