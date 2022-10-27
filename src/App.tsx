import React, { useState } from "react";
import "./App.css";

import VegaLiteV5Schema from "./constants/vega-lite-v5-schema.json";
import Editor from "./components/Editor";
import { ProjectionProps } from "../src/lib/widgets";
// bundling tail wind with component?

const code2 = `
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A simple bar chart with embedded data.",
  "data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
      {"a": "D", "b": 91}, {"a": "E", "b": 81}, {"a": "F", "b": 53},
      {"a": "G", "b": 19}, {"a": "H", "b": 87}, {"a": "I", "b": 52}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
    "y": {"field": "b", "type": "quantitative"}
  }
}
`;

function ExampleProjection(props: ProjectionProps) {
  const [count, setCount] = useState(0);
  return (
    <div
      onClick={(e) => {
        setCount(count + 1);
      }}
    >
      counter-{count}
    </div>
  );
}

function App() {
  const [currentCode, setCurrentCode] = useState(code2);
  return (
    <div className="App">
      <Editor
        schema={VegaLiteV5Schema}
        code={code2}
        onChange={() => {}}
        projections={[
          {
            query: ["data", "values", "*"],
            type: "tooltip",
            projection: ({ keyPath }) => {
              return <div>hi annotation projection {keyPath.join(",")}</div>;
            },
          },
          {
            // query: ["data", "values", "*"],
            query: ["description", "description-key"],
            type: "inline",
            projection: ExampleProjection,
          },
        ]}
      />
    </div>
  );
}

export default App;
