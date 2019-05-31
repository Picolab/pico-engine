import * as React from "react";
import { connect } from "react-redux";
import { delChannel, Dispatch, newChannel } from "../../Action";
import { Channel, PicoBox, PicoState, State } from "../../State";
import {
  ParseNViewEventPolicy,
  ParseNViewQueryPolicy,
  ViewEventPolicy,
  ViewQueryPolicy,
  parseEventPolicy,
  parseQueryPolicy
} from "../widgets/ChannelPolicies";

interface PropsFromParent {
  pico: PicoBox;
}

interface Props extends PropsFromParent {
  dispatch: Dispatch;
  picoState?: PicoState;
}

interface LocalState {
  expandedChannels: { [eci: string]: boolean };

  tags: string;
  eventPolicy: string;
  queryPolicy: string;
}

class Channels extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);

    this.state = {
      expandedChannels: {},

      tags: "one, two",
      eventPolicy: `allow *:*`,
      queryPolicy: `allow */*`
    };

    this.addChannel = this.addChannel.bind(this);
    this.toggleChannel = this.toggleChannel.bind(this);
  }

  isReadyToAdd(): boolean {
    try {
      this.getNewChannData();
    } catch (err) {
      return false;
    }
    return true;
  }

  getNewChannData(): any {
    const { tags, eventPolicy, queryPolicy } = this.state;

    return {
      tags: tags.split(","),
      eventPolicy: parseEventPolicy(eventPolicy),
      queryPolicy: parseQueryPolicy(queryPolicy)
    };
  }

  addChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!this.isReadyToAdd()) {
      return;
    }
    const { pico } = this.props;
    const { dispatch } = this.props;
    const data = this.getNewChannData();
    dispatch(newChannel(pico.eci, data));
  }

  toggleChannel(checked: boolean, eci: string) {
    const map = Object.assign({}, this.state.expandedChannels);
    if (checked) {
      map[eci] = true;
    } else {
      delete map[eci];
    }
    this.setState({ expandedChannels: map });
  }

  delChannel(eci: string) {
    const { dispatch, pico } = this.props;
    dispatch(delChannel(pico.eci, eci));
  }

  render() {
    const { pico, picoState } = this.props;
    const { expandedChannels } = this.state;

    const waiting: boolean = picoState
      ? picoState.addChannel_apiSt.waiting || picoState.delChannel_apiSt.waiting
      : true;

    const newChannelError: string | null | undefined = picoState
      ? picoState.addChannel_apiSt.error
      : null;

    const delChannelError: string | null | undefined = picoState
      ? picoState.delChannel_apiSt.error
      : null;

    const channels: Channel[] =
      (picoState && picoState.details && picoState.details.channels) || [];

    return (
      <div>
        <h3>Channels</h3>
        {delChannelError ? (
          <span className="text-danger">{delChannelError}</span>
        ) : (
          ""
        )}
        {channels.length === 0 ? (
          <div className="text-muted">- no channels -</div>
        ) : (
          channels.map(channel => {
            const isOpen = !!expandedChannels[channel.id];
            return (
              <div key={channel.id}>
                <div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`chann-${channel.id}`}
                      onChange={e =>
                        this.toggleChannel(e.target.checked, channel.id)
                      }
                      checked={isOpen}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`chann-${channel.id}`}
                    >
                      <span className="text-mono">{channel.id}</span>
                    </label>
                    {channel.tags.map((tag, i) => {
                      return (
                        <span key={i} className="badge badge-secondary ml-1">
                          {tag}
                        </span>
                      );
                    })}
                    <button
                      className="btn btn-link btn-sm"
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        this.delChannel(channel.id);
                      }}
                      disabled={waiting}
                    >
                      delete
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="ml-3">
                    {channel.familyChannelPicoID ? (
                      <div className="text-muted">
                        This is a family channel.
                      </div>
                    ) : (
                      <div className="row">
                        <div className="col">
                          Event Policy
                          <ViewEventPolicy policy={channel.eventPolicy} />
                        </div>
                        <div className="col">
                          Query Policy
                          <ViewQueryPolicy policy={channel.queryPolicy} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  ""
                )}
              </div>
            );
          })
        )}
        <hr />
        <h3>New Channel</h3>
        <form onSubmit={this.addChannel}>
          <div className="form-group">
            <label htmlFor="new-chann-tags">Tags</label>
            <div className="row">
              <div className="col">
                <input
                  id="new-chann-tags"
                  type="text"
                  className="form-control"
                  value={this.state.tags}
                  onChange={e => this.setState({ tags: e.target.value })}
                />
              </div>
              <div className="col">Tags</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="new-chann-event-policy">Event Policy</label>
            <div className="row">
              <div className="col">
                <textarea
                  id="new-chann-event-policy"
                  rows={3}
                  className="form-control"
                  value={this.state.eventPolicy}
                  onChange={e => this.setState({ eventPolicy: e.target.value })}
                />
              </div>
              <div className="col">
                <ParseNViewEventPolicy src={this.state.eventPolicy} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="new-chann-query-policy">Query Policy</label>
            <div className="row">
              <div className="col">
                <textarea
                  id="new-chann-query-policy"
                  rows={3}
                  className="form-control"
                  value={this.state.queryPolicy}
                  onChange={e => this.setState({ queryPolicy: e.target.value })}
                />
              </div>
              <div className="col">
                <ParseNViewQueryPolicy src={this.state.queryPolicy} />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-outline-primary"
            disabled={waiting || !this.isReadyToAdd()}
          >
            Add
          </button>
          {newChannelError ? (
            <span className="text-danger">{newChannelError}</span>
          ) : (
            ""
          )}
        </form>
      </div>
    );
  }
}

export default connect((state: State, props: PropsFromParent) => {
  const picoState = state.picos[props.pico.eci];
  return {
    picoState
  };
})(Channels);
