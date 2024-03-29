import * as React from "react";

interface Props {
  error?: string | null;
}

const ErrorStatus: React.FC<Props> = (props) => {
  return props.error ? (
    <span className="text-danger">{props.error}</span>
  ) : (
    <span />
  );
};

export default ErrorStatus;
