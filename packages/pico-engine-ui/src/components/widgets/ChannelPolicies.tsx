import * as React from "react";
import {
  EventPolicy,
  EventPolicyRule,
  QueryPolicy,
  QueryPolicyRule
} from "../../types/Channel";

type ParsedRule<T> = { kind: "allow" | "deny"; rule: T };

function parseEventPolicyLine(
  line: string
): ParsedRule<EventPolicyRule> | null {
  line = line.replace(/\s+/g, " ").trim();
  if (line.length === 0) {
    return null;
  }
  const m = /^(allow|deny) (.*)$/i.exec(line);
  if (!m) {
    throw new Error("Each line must start with `allow` or `deny`.");
  }
  const parts = m[2].split(":");
  if (parts.length !== 2) {
    throw new Error("Expected `domain:name`");
  }
  const domain = parts[0].trim();
  const name = parts[1].trim();
  if (domain.length === 0) {
    throw new Error("Missing event `domain`.");
  }
  if (name.length === 0) {
    throw new Error("Missing event `name`.");
  }
  const rule: EventPolicyRule = { domain, name };
  const kind = m[1].toLocaleLowerCase();
  switch (kind) {
    case "allow":
    case "deny":
      return { kind, rule };
    default:
      throw new Error('Expected "allow" or "deny"');
  }
}

function parseQueryPolicyLine(
  line: string
): ParsedRule<QueryPolicyRule> | null {
  line = line.replace(/\s+/g, " ").trim();
  if (line.length === 0) {
    return null;
  }
  const m = /^(allow|deny) (.*)$/i.exec(line);
  if (!m) {
    throw new Error("Each line must start with `allow` or `deny`.");
  }
  const parts = m[2].split("/");
  if (parts.length !== 2) {
    throw new Error("Expected `rid/name`");
  }
  const rid = parts[0].trim();
  const name = parts[1].trim();
  if (rid.length === 0) {
    throw new Error("Missing event `rid`.");
  }
  if (name.length === 0) {
    throw new Error("Missing event `name`.");
  }
  const rule: QueryPolicyRule = { rid, name };
  const kind = m[1].toLocaleLowerCase();
  switch (kind) {
    case "allow":
    case "deny":
      return { kind, rule };
    default:
      throw new Error('Expected "allow" or "deny"');
  }
}

export function parseEventPolicy(src: string): EventPolicy {
  const policy: EventPolicy = { allow: [], deny: [] };
  for (const line of src.split("\n")) {
    const parsed = parseEventPolicyLine(line);
    if (parsed) {
      policy[parsed.kind].push(parsed.rule);
    }
  }
  return policy;
}

export function parseQueryPolicy(src: string): QueryPolicy {
  const policy: QueryPolicy = { allow: [], deny: [] };
  for (const line of src.split("\n")) {
    const parsed = parseQueryPolicyLine(line);
    if (parsed) {
      policy[parsed.kind].push(parsed.rule);
    }
  }
  return policy;
}

export const ParseError: React.FC<{
  error: any;
  line: string;
}> = ({ error, line }) => {
  const errStr = (error + "").replace(/^\w*Error:/i, "").trim();
  return (
    <div>
      <span className="text-danger">{errStr}</span>
      <span className="text-muted ml-1 mr-1">Line:</span>
      <span className="text-mono">{line}</span>
    </div>
  );
};

export const ParseNViewEventPolicy: React.FC<{
  src: string;
}> = ({ src }) => {
  return (
    <div>
      {src.split("\n").map((line, i) => {
        try {
          const parsed = parseEventPolicyLine(line);
          if (parsed) {
            return (
              <ViewEventPolicyRule
                key={i}
                rule={parsed.rule}
                isAllow={parsed.kind === "allow"}
              />
            );
          }
        } catch (err) {
          return <ParseError key={i} error={err} line={line} />;
        }
      })}
    </div>
  );
};

export const ParseNViewQueryPolicy: React.FC<{
  src: string;
}> = ({ src }) => {
  return (
    <div>
      {src.split("\n").map((line, i) => {
        try {
          const parsed = parseQueryPolicyLine(line);
          if (parsed) {
            return (
              <ViewQueryPolicyRule
                key={i}
                rule={parsed.rule}
                isAllow={parsed.kind === "allow"}
              />
            );
          }
        } catch (err) {
          return <ParseError key={i} error={err} line={line} />;
        }
      })}
    </div>
  );
};

export const ViewEventPolicy: React.FC<{
  policy: EventPolicy;
}> = ({ policy }) => {
  return (
    <div>
      {policy.allow.map((rule, i) => (
        <ViewEventPolicyRule key={i} rule={rule} isAllow={true} />
      ))}
      {policy.deny.map((rule, i) => (
        <ViewEventPolicyRule key={i} rule={rule} />
      ))}
    </div>
  );
};

export const ViewQueryPolicy: React.FC<{
  policy: QueryPolicy;
}> = ({ policy }) => {
  return (
    <div>
      {policy.allow.map((rule, i) => (
        <ViewQueryPolicyRule key={i} rule={rule} isAllow={true} />
      ))}
      {policy.deny.map((rule, i) => (
        <ViewQueryPolicyRule key={i} rule={rule} />
      ))}
    </div>
  );
};

const ViewEventPolicyRule: React.FC<{
  rule: EventPolicyRule;
  isAllow?: boolean;
}> = ({ isAllow, rule }) => {
  return (
    <div className="text-mono">
      {isAllow ? (
        <span className="badge badge-success mr-2">allow</span>
      ) : (
        <span className="badge badge-danger mr-2">deny</span>
      )}
      {rule.domain}
      <b> : </b>
      {rule.name}
    </div>
  );
};

const ViewQueryPolicyRule: React.FC<{
  rule: QueryPolicyRule;
  isAllow?: boolean;
}> = ({ isAllow, rule }) => {
  return (
    <div className="text-mono">
      {isAllow ? (
        <span className="badge badge-success mr-2">allow</span>
      ) : (
        <span className="badge badge-danger mr-2">deny</span>
      )}
      {rule.rid}
      <b> / </b>
      {rule.name}
    </div>
  );
};
