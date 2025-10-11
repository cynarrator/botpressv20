import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'

// Simple confirm dialog replacement to avoid Blueprint.js dependency
const confirmDialog = async (message: string, options?: any) => {
  return window.confirm(message)
}

// Simple MoreOptions replacement to avoid Blueprint.js dependency
const MoreOptions = ({ show, onToggle, items }: any) => {
  if (!show || !items.length) return null

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation()
          onToggle(!show)
        }}
        type="button"
        className="more-options-btn"
        style={{ marginLeft: '8px', padding: '4px 8px', cursor: 'pointer' }}
      >
        ⋯
      </button>
      {show && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={e => {
              e.stopPropagation()
              onToggle(false)
            }}
          />
          <ul
            style={{
              position: 'absolute',
              right: '10px',
              top: '100%',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              listStyle: 'none',
              padding: '8px 0',
              margin: '4px 0',
              zIndex: 1000,
              minWidth: '150px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {items.map((item: any, index: number) => (
              <li key={index}>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onToggle(false)
                    item.action()
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
import Close from '../icons/Close'
import Delete from '../icons/Delete'
import Download from '../icons/Download'
import Information from '../icons/Information'
import List from '../icons/List'
import Reload from '../icons/Reload'
import { RootStore, StoreDef } from '../store'

import Avatar from './common/Avatar'

class Header extends React.Component<HeaderProps> {
  private btnEls: { [index: number]: HTMLElement } = {}

  state = {
    currentFocusIdx: undefined,
    showingOption: false
  }

  componentDidMount() {
    observe(this.props.focusedArea, focus => {
      focus.newValue === 'header' && this.changeButtonFocus(1)
    })
  }

  onBlur = () => {
    this.setCurrentFocusIdx(undefined)
  }

  setCurrentFocusIdx = currentFocusIdx => {
    this.setState({ currentFocusIdx })
  }

  changeButtonFocus = step => {
    let idx: number = this.state.currentFocusIdx !== null ? this.state.currentFocusIdx + step : 0

    if (idx < 0) {
      this.onBlur()
      this.props.focusPrevious()
    }

    for (idx; idx < Object.keys(this.btnEls).length; idx++) {
      if (this.btnEls[idx]) {
        this.btnEls[idx].focus()
        this.setCurrentFocusIdx(idx)
        break
      }
    }

    if (idx === Object.keys(this.btnEls).length) {
      this.onBlur()
      this.props.focusNext()
    }
  }

  renderTitle = () => {
    const title = this.props.isConversationsDisplayed
      ? this.props.intl.formatMessage({ id: 'header.conversations' })
      : this.props.botName

    return (
      <div className={'bpw-header-title'}>
        <div className={'bpw-header-name'}>
          {title}
          {this.props.hasUnreadMessages && <span className={'bpw-header-unread'}>{this.props.unreadCount}</span>}
        </div>
        {this.props.hasBotInfoDescription && (
          <div className={'bpw-header-subtitle'}>{this.props.botConvoDescription}</div>
        )}
      </div>
    )
  }

  handleDeleteConversation = async () => {
    if (
      await confirmDialog(
        this.props.intl.formatMessage({
          id: 'header.deleteConversation'
        }),
        {
          acceptLabel: this.props.intl.formatMessage({
            id: 'header.deleteConversationYes'
          }),
          declineLabel: this.props.intl.formatMessage({
            id: 'header.deleteConversationNo'
          })
        }
      )
    ) {
      await this.props.deleteConversation()
    }
  }

  renderDeleteConversationButton() {
    return (
      <button
        type="button"
        tabIndex={-1}
        id="btn-delete-conversation"
        aria-label={this.props.intl.formatMessage({
          id: 'header.deleteConversationButton',
          defaultMessage: 'Delete conversation'
        })}
        title={this.props.intl.formatMessage({
          id: 'header.deleteConversationButton',
          defaultMessage: 'Delete conversation'
        })}
        ref={el => (this.btnEls[0] = el)}
        className={'bpw-header-icon bpw-header-icon-delete'}
        onClick={this.handleDeleteConversation}
        onKeyDown={this.handleKeyDown.bind(this, this.handleDeleteConversation)}
        onBlur={this.onBlur}
      >
        <Delete />
      </button>
    )
  }

  renderResetButton() {
    return (
      <button
        type="button"
        tabIndex={-1}
        id="btn-reset"
        aria-label={this.props.intl.formatMessage({
          id: 'header.resetConversation',
          defaultMessage: 'Reset conversation'
        })}
        title={this.props.intl.formatMessage({
          id: 'header.resetConversation',
          defaultMessage: 'Reset conversation'
        })}
        ref={el => (this.btnEls[1] = el)}
        className={'bpw-header-icon bpw-header-icon-reset'}
        onClick={this.props.resetSession}
        onKeyDown={this.handleKeyDown.bind(this, this.props.resetSession)}
        onBlur={this.onBlur}
      >
        <Reload />
      </button>
    )
  }

  renderDownloadButton() {
    return (
      <button
        type="button"
        tabIndex={-1}
        id="btn-download"
        aria-label={this.props.intl.formatMessage({
          id: 'header.downloadConversation',
          defaultMessage: 'Download conversation'
        })}
        title={this.props.intl.formatMessage({
          id: 'header.downloadConversation',
          defaultMessage: 'Download conversation'
        })}
        ref={el => (this.btnEls[2] = el)}
        className={'bpw-header-icon bpw-header-icon-download'}
        onClick={this.props.downloadConversation}
        onKeyDown={this.handleKeyDown.bind(this, this.props.downloadConversation)}
        onBlur={this.onBlur}
      >
        <Download />
      </button>
    )
  }

  renderConvoButton() {
    return (
      <button
        type="button"
        tabIndex={-1}
        id="btn-conversations"
        aria-label={this.props.intl.formatMessage({
          id: 'header.conversations',
          defaultMessage: 'Conversations'
        })}
        title={this.props.intl.formatMessage({
          id: 'header.conversations',
          defaultMessage: 'Conversations'
        })}
        ref={el => (this.btnEls[3] = el)}
        className={'bpw-header-icon bpw-header-icon-convo'}
        onClick={this.props.toggleConversations}
        onKeyDown={this.handleKeyDown.bind(this, this.props.toggleConversations)}
        onBlur={this.onBlur}
      >
        <List />
      </button>
    )
  }

  renderBotInfoButton() {
    return (
      <button
        type="button"
        tabIndex={-1}
        id="btn-botinfo"
        aria-label={this.props.intl.formatMessage({
          id: 'header.botInfo',
          defaultMessage: 'Bot information'
        })}
        title={this.props.intl.formatMessage({
          id: 'header.botInfo',
          defaultMessage: 'Bot information'
        })}
        ref={el => (this.btnEls[4] = el)}
        className={'bpw-header-icon bpw-header-icon-botinfo'}
        onClick={this.props.toggleBotInfo}
        onKeyDown={this.handleKeyDown.bind(this, this.props.toggleBotInfo)}
        onBlur={this.onBlur}
      >
        <Information />
      </button>
    )
  }

  renderCloseButton() {
    return (
      <button
        type="button"
        id="btn-close"
        aria-label={this.props.intl.formatMessage({
          id: 'header.hideChatWindow',
          defaultMessage: 'Hide the chat window'
        })}
        title={this.props.intl.formatMessage({
          id: 'header.hideChatWindow',
          defaultMessage: 'Hide the chat window'
        })}
        ref={el => (this.btnEls[5] = el)}
        className={'bpw-header-icon bpw-header-icon-close'}
        onClick={this.props.hideChat}
        onKeyDown={this.handleKeyDown.bind(this, this.props.hideChat)}
        onBlur={this.onBlur}
      >
        <Close />
      </button>
    )
  }

  renderCustomButtons() {
    return this.props.customButtons.map(btn => {
      const Icon: any = btn.icon
      return (
        <button
          type="button"
          key={btn.id}
          id={`btn-${btn.id}`}
          tabIndex={-1}
          className={'bpw-header-icon'}
          onClick={btn.onClick.bind(this, btn.id, this)}
          aria-label={btn.label || ''}
          title={btn.label || ''}
        >
          {typeof Icon === 'function' ? <Icon /> : Icon}
        </button>
      )
    })
  }

  handleKeyDown = (action, e) => {
    if (!this.props.enableArrowNavigation) {
      return
    }

    if (e.key === 'ArrowUp') {
      this.props.focusPrevious()
    } else if (e.key === 'ArrowDown') {
      this.props.focusNext()
    } else if (e.key === 'ArrowLeft') {
      this.changeButtonFocus(-1)
    } else if (e.key === 'ArrowRight') {
      this.changeButtonFocus(1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  setShowingOption = val => {
    this.setState({ showingOption: val })
  }

  render() {
    const optionsItems = []

    if (this.props.showDownloadButton) {
      optionsItems.push({
        label: 'Download Conversation',
        action: this.props.downloadConversation
      })
    }

    if (this.props.showConversationsButton) {
      optionsItems.push({
        label: 'Toggle List View',
        action: this.props.toggleConversations
      })
    }

    if (this.props.showBotInfoButton) {
      optionsItems.push({
        label: 'Toggle Bot Info',
        action: this.props.toggleBotInfo
      })
    }

    if (this.props.showDeleteConversationButton) {
      optionsItems.push({
        label: 'Delete conversation',
        action: this.props.deleteConversation
      })
    }

    if (this.props.isEmulator) {
      return (
        <div className="bpw-emulator-header">
          <span className="bpw-emulator-header-tab">Emulator</span>
          <div>
            <span className="bpw-emulator-buttons">{this.props.showResetButton && this.renderResetButton()}</span>
            <MoreOptions show={this.state.showingOption} onToggle={this.setShowingOption} items={optionsItems} />
          </div>
        </div>
      )
    }

    return (
      <div className={'bpw-header-container'}>
        <div className={'bpw-header-title-flexbox'}>
          <div className={'bpw-header-title-container'}>
            <Avatar name={this.props.botName} avatarUrl={this.props.botAvatarUrl} height={40} width={40} />
            {this.renderTitle()}
          </div>
        </div>
        {!!this.props.customButtons.length && this.renderCustomButtons()}
        {this.props.showDeleteConversationButton && this.renderDeleteConversationButton()}
        {this.props.showResetButton && this.renderResetButton()}
        {this.props.showDownloadButton && this.renderDownloadButton()}
        {this.props.showConversationsButton && this.renderConvoButton()}
        {this.props.showBotInfoButton && this.renderBotInfoButton()}
        {this.props.showCloseButton && this.renderCloseButton()}
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  intl: store.intl,
  isConversationsDisplayed: store.view.isConversationsDisplayed,
  showDeleteConversationButton: store.view.showDeleteConversationButton,
  showDownloadButton: store.view.showDownloadButton,
  showBotInfoButton: store.view.showBotInfoButton,
  showConversationsButton: store.view.showConversationsButton,
  showResetButton: store.view.showResetButton,
  showCloseButton: store.view.showCloseButton,
  hasUnreadMessages: store.view.hasUnreadMessages,
  unreadCount: store.view.unreadCount,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  focusedArea: store.view.focusedArea,
  hideChat: store.view.hideChat,
  toggleConversations: store.view.toggleConversations,
  toggleBotInfo: store.view.toggleBotInfo,
  customButtons: store.view.customButtons,

  deleteConversation: store.deleteConversation,
  resetSession: store.resetSession,
  downloadConversation: store.downloadConversation,
  botName: store.botName,
  botAvatarUrl: store.botAvatarUrl,
  hasBotInfoDescription: store.hasBotInfoDescription,
  isEmulator: store.isEmulator,
  botConvoDescription: store.config.botConvoDescription,
  enableArrowNavigation: store.config.enableArrowNavigation
}))(observer(Header))

type HeaderProps = Pick<
  StoreDef,
  | 'intl'
  | 'sendMessage'
  | 'focusPrevious'
  | 'focusNext'
  | 'focusedArea'
  | 'isConversationsDisplayed'
  | 'botName'
  | 'isEmulator'
  | 'hasUnreadMessages'
  | 'unreadCount'
  | 'hasBotInfoDescription'
  | 'deleteConversation'
  | 'resetSession'
  | 'downloadConversation'
  | 'toggleConversations'
  | 'hideChat'
  | 'toggleBotInfo'
  | 'botAvatarUrl'
  | 'showResetButton'
  | 'showDeleteConversationButton'
  | 'showDownloadButton'
  | 'showConversationsButton'
  | 'showBotInfoButton'
  | 'showCloseButton'
  | 'enableArrowNavigation'
  | 'botConvoDescription'
  | 'customButtons'
>
