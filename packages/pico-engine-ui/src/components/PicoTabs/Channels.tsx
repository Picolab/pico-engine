import * as React from "react";
import { apiGet, apiPost } from "../../Action";
import { Channel, PicoBox, PicoDetails } from "../../State";
import useAsyncAction from "../../useAsyncAction";
import useAsyncLoader from "../../useAsyncLoader";
import {
  parseEventPolicy,
  ParseNViewEventPolicy,
  ParseNViewQueryPolicy,
  parseQueryPolicy,
  ViewEventPolicy,
  ViewQueryPolicy
} from "../widgets/ChannelPolicies";

interface Props {
  pico: PicoBox;
}

const Channels: React.FC<Props> = ({ pico }) => {
  const [expandedChannels, setExpandedChannels] = React.useState<{
    [eci: string]: boolean;
  }>({});
  const [tags, setTags] = React.useState<string>("one, two");
  const [eventPolicy, setEventPolicy] = React.useState<string>("allow *:*");
  const [queryPolicy, setQueryPolicy] = React.useState<string>("allow */*");

  function getNewChannData(): any {
    return {
      tags: tags.split(","),
      eventPolicy: parseEventPolicy(eventPolicy),
      queryPolicy: parseQueryPolicy(queryPolicy)
    };
  }

  function isReadyToAdd(): boolean {
    try {
      getNewChannData();
    } catch (err) {
      return false;
    }
    return true;
  }

  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.next/pico`)
  );

  const addChannel = useAsyncAction<{ eci: string; data: any }>(
    ({ eci, data }) =>
      apiPost(
        `/c/${eci}/event/engine-ui/new-channel/query/io.picolabs.next/pico`,
        data
      ).then(d => picoDetails.setData(d))
  );

  const delChannel = useAsyncAction<string>(eci =>
    apiPost(
      `/c/${pico.eci}/event/engine-ui/del-channel/query/io.picolabs.next/pico`,
      { eci }
    ).then(d => picoDetails.setData(d))
  );

  React.useEffect(() => {
    picoDetails.load();
  }, [pico.eci]);

  const waiting: boolean =
    picoDetails.waiting || delChannel.waiting || addChannel.waiting;

  const channels: Channel[] =
    (picoDetails.data && picoDetails.data.channels) || [];

  return (
    <div>
      <h3>Channels</h3>
      {delChannel.error ? (
        <span className="text-danger">{delChannel.error}</span>
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
                    onChange={e => {
                      const eci = channel.id;
                      const map = Object.assign({}, expandedChannels);
                      if (e.target.checked) {
                        map[eci] = true;
                      } else {
                        delete map[eci];
                      }
                      setExpandedChannels(map);
                    }}
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
                      delChannel.act(channel.id);
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
                    <div className="text-muted">This is a family channel.</div>
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
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!isReadyToAdd()) {
            return;
          }
          const data = getNewChannData();
          addChannel.act({ eci: pico.eci, data });
        }}
      >
        <div className="form-group">
          <label htmlFor="new-chann-tags">Tags</label>
          <div className="row">
            <div className="col">
              <input
                id="new-chann-tags"
                type="text"
                className="form-control"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>
            <div className="col">
              {tags.split(",").map((tag, i) => {
                return (
                  <span key={i} className="badge badge-secondary ml-1">
                    {tag.trim()}
                  </span>
                );
              })}
            </div>
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
                value={eventPolicy}
                onChange={e => setEventPolicy(e.target.value)}
              />
            </div>
            <div className="col">
              <ParseNViewEventPolicy src={eventPolicy} />
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
                value={queryPolicy}
                onChange={e => setQueryPolicy(e.target.value)}
              />
            </div>
            <div className="col">
              <ParseNViewQueryPolicy src={queryPolicy} />
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-outline-primary"
          disabled={waiting || !isReadyToAdd()}
        >
          Add
        </button>
        {addChannel.error ? (
          <span className="text-danger">{addChannel.error}</span>
        ) : (
          ""
        )}
      </form>
    </div>
  );
};

export default Channels;
