import type { CloseFriend } from '../types'
import { Icon } from './Icon'

interface CloseFriendsPanelProps {
  closeFriends: CloseFriend[]
  targetScreenName: string
}

export function CloseFriendsPanel({ closeFriends, targetScreenName }: CloseFriendsPanelProps) {
  if (closeFriends.length === 0) return null

  return (
    <section className="panel close-friends-panel" aria-labelledby="close-friends-heading">
      <div className="panel-heading-row">
        <h2 id="close-friends-heading">親密ユーザー</h2>
        <span className="panel-caption">{closeFriends.length} 人検出</span>
      </div>
      <p className="field-hint">
        @{targetScreenName} と頻繁に交流しているユーザーです。これらのユーザーのFF一覧から共通の鍵垢を検出します。
      </p>
      <div className="close-friends-grid">
        {closeFriends.map((friend) => (
          <div key={friend.userId} className="close-friend-card">
            <div className="close-friend-avatar" aria-hidden="true">
              {friend.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="close-friend-info">
              <strong>@{friend.screenName}</strong>
              <span className="close-friend-name">{friend.displayName}</span>
            </div>
            <div className="close-friend-stats">
              <span title="リプライ数"><Icon name="chat" size={14} /> {friend.replyCount}</span>
              <span title="メンション数"><Icon name="at" size={14} /> {friend.mentionCount}</span>
            </div>
            <div className="close-friend-score">
              交流度 <strong>{friend.interactionScore.toFixed(1)}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
