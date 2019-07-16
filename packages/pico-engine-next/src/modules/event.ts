import * as krl from "../krl";

const event: krl.Module = {
  eid: krl.Property(function() {
    let event = this.getEvent();
    if (event) {
      return event.eid;
    }
    return null;
  })
};

export default event;
