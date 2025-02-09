import { useState, useEffect } from "react";
import {
  Editor,
  StandardBundle,
  Projection,
  ProjectionProps,
  utils,
} from "../../../../packages/prong-editor/src/index";
import VegaSchema from "../constants/vega-schema.json";

import {
  analyzeVegaCode,
  buttonListProjection,
  buildInlineDropDownProjection,
} from "./example-utils";
import VegaExpressionEditor from "./VegaExpressionEditor";
import {
  createHistograms,
  PreComputedHistograms,
  extractFieldNames,
  extractScaleNames,
  DataTable,
  isDataTable,
  buildSparkProjection,
} from "./histograms";

import "../stylesheets/vega-example.css";

const initialSpec = `{
  "data": [
    {
      "name": "states",
      "url": "data/us-10m.json",
      "format": {"type": "topojson", "feature": "states"}
    },
    {
      "name": "obesity",
      "url": "data/obesity.json",
      "transform": [
        {
          "type": "lookup",
          "from": "states", "key": "id",
          "fields": ["id"], "as": ["geo"]
        },
        {
          "type": "filter",
          "expr": "datum.geo"
        },
        {
          "type": "formula", "as": "centroid",
          "expr": "geoCentroid('projection', datum.geo)"
        }
      ]
    }
  ],

  "projections": [
    {
      "name": "projection",
      "type": "albersUsa",
      "scale": 1100,
      "translate": [{"signal": "width / 2"}, {"signal": "height / 2"}]
    }
  ],

  "scales": [
    {
      "name": "size",
      "domain": {"data": "obesity", "field": "rate"},
      "zero": false, "range": [1000, 5000]
    },
    {
      "name": "color", "type": "linear", "nice": true,
      "domain": {"data": "obesity", "field": "rate"},
      "range": "ramp"
    }
  ],

  "marks": [
    {
      "name": "circles",
      "type": "symbol",
      "from": {"data": "obesity"},
      "encode": {
        "enter": {
          "size": {"scale": "size", "field": "rate"},
          "fill": {"scale": "color", "field": "rate"},
          "stroke": {"value": "white"},
          "strokeWidth": {"value": 1.5},
          "x": {"field": "centroid[0]"},
          "y": {"field": "centroid[1]"},
          "tooltip": {"signal": "'Obesity Rate: ' + format(datum.rate, '.1%')"}
        }
      },
      "transform": [
        {
          "type": "force",
          "static": true,
          "forces": [
            {"force": "collide", "radius": {"expr": "1 + sqrt(datum.size) / 2"}},
            {"force": "x", "x": "datum.centroid[0]"},
            {"force": "y", "y": "datum.centroid[1]"}
          ]
        }
      ]
    },
    {
      "type": "text",
      "interactive": false,
      "from": {"data": "circles"},
      "encode": {
        "enter": {
          "align": {"value": "center"},
          "baseline": {"value": "middle"},
          "fontSize": {"value": 13},
          "fontWeight": {"value": "bold"},
          "text": {"field": "datum.state"}
        },
        "update": {
          "x": {"field": "x"},
          "y": {"field": "y"}
        }
      }
    }
  ],
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "A Dorling cartogram depicting U.S. state obesity rates.",
  "width": 900,
  "height": 520,
  "autosize": "none"
}`;

interface EditorProps extends ProjectionProps {
  signals: any;
}
function ExpressionEditorProjection(props: EditorProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<null | string>(null);
  useEffect(() => {
    setCode(props.currentValue.slice(1, props.currentValue.length - 1));
  }, [props.currentValue]);
  return (
    <div className="signal-editor">
      <div className="signal-editor-list">
        {Object.entries(props.signals).map(([key, value]) => (
          <div className="signal-editor-list--item" key={key}>
            <b>{key}</b>: {JSON.stringify(value)}
          </div>
        ))}
      </div>
      <div className="flex">
        <VegaExpressionEditor
          onChange={(update) => setCode(update)}
          code={code}
          terms={Object.keys(props.signals)}
          onError={(e) => setError(e)}
        />
        <button
          onClick={() => {
            props.setCode(
              utils.setIn(props.keyPath, `"${code}"`, props.fullCode)
            );
          }}
        >
          UPDATE
        </button>
      </div>
      {error && <div className="signal-editor-error-message">{error}</div>}
    </div>
  );
}

const mapProjections = [
  "albers",
  "albersUsa",
  "azimuthalEqualArea",
  "azimuthalEquidistant",
  "conicConformal",
  "conicEqualArea",
  "conicEquidistant",
  "equalEarth",
  "equirectangular",
  "gnomonic",
  "identity",
  "mercator",
  "mollweide",
  "naturalEarth1",
  "orthographic",
  "stereographic",
  "transverseMercator",
];
function getMapProjectionTypes(currentCode: string): string[] {
  return ((utils.simpleParse(currentCode, {})?.projections || []) as any[])
    .map((proj) => proj?.type || false)
    .filter((x) => x);
}

function VegaUseCase() {
  const [currentCode, setCurrentCode] = useState(initialSpec);
  const [preComputedHistograms, setPrecomputedHistograms] =
    useState<PreComputedHistograms>({});
  const [fieldNames, setFieldNames] = useState<string[]>([]);
  const [scaleNames, setScales] = useState<string[]>([]);
  const [signals, setSignals] = useState<any>({});
  const [mapProjectionTypes, setMapProjectionTypes] = useState<string[]>([]);

  useEffect(() => {
    analyzeVegaCode(currentCode, ({ data, signals }) => {
      const namedPairs = Object.entries(data)
        .filter(([_key, dataSet]) => isDataTable(dataSet))
        .map(([key, data]) => [key, createHistograms(data as DataTable)]);
      setPrecomputedHistograms(Object.fromEntries(namedPairs));
      setSignals(signals);
      setFieldNames(extractFieldNames(data || {}));
      setMapProjectionTypes(getMapProjectionTypes(currentCode));
    });
    setScales(extractScaleNames(currentCode));
  }, [currentCode]);
  return (
    <Editor
      schema={VegaSchema}
      code={currentCode}
      onChange={(x) => setCurrentCode(x)}
      projections={
        [
          ...Object.values(StandardBundle),
          buildSparkProjection(preComputedHistograms, "right", "bar"),
          {
            type: "tooltip",
            takeOverMenu: true,
            query: {
              type: "schemaMatch",
              query: ["exprString", "signal", "expr"],
            },
            name: "Signal Editor",
            projection: (props: ProjectionProps) => (
              <ExpressionEditorProjection {...props} signals={signals} />
            ),
          },
          ...mapProjectionTypes.map((_mapProj, idx) =>
            buildInlineDropDownProjection(
              mapProjections,
              mapProjectionTypes[idx],
              ["projections", idx, "type", "type___value"],
              "Map Projection Dropdown"
            )
          ),
          {
            type: "tooltip",
            query: {
              type: "schemaMatch",
              query: ["field", "stringOrSignal"],
            },
            name: "Switch to",
            projection: buttonListProjection(fieldNames, currentCode),
          },
          {
            type: "tooltip",
            query: {
              type: "schemaMatch",
              query: ["scale"],
            },
            name: "Switch to",
            projection: buttonListProjection(scaleNames, currentCode),
          },
        ] as Projection[]
      }
    />
  );
}

export default VegaUseCase;
