import * as React from "react";
import { RulesetSchemaAttr } from "../../types/RulesetSchema";

interface Props {
  columns: "attrs" | "params";
  rows: RulesetSchemaAttr[];
}

const SchemaAttrTable: React.FC<Props> = ({ columns, rows }) => {
  if (!rows.length) {
    return <p className="text-muted small mb-2">No attributes.</p>;
  }
  return (
    <div className="table-responsive mb-2">
      <table className="table table-sm table-bordered mb-0">
        <thead className="thead-light">
          <tr>
            <th>{columns === "attrs" ? "Attribute" : "Parameter"}</th>
            <th>Type</th>
            <th>Required</th>
            {columns === "params" ? <th>Default</th> : null}
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              <td>{row.type || ""}</td>
              <td>{row.required !== false ? "yes" : "no"}</td>
              {columns === "params" ? (
                <td className="text-mono small">
                  {row.default !== undefined
                    ? JSON.stringify(row.default)
                    : row.defaultExpr || ""}
                </td>
              ) : null}
              <td className="small">{row.description || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchemaAttrTable;
