declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface GeographiesRenderProps<TFeature = any> {
    geographies: TFeature[];
    projection: any;
  }

  export interface GeographiesProps {
    geography: string | object;
    children?: (props: GeographiesRenderProps) => React.ReactNode;
  }

  export const Geographies: React.FC<GeographiesProps>;

  export interface GeographyProps {
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: Record<string, React.CSSProperties>;
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
    onClick?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
    title?: string;
  }

  export const Geography: React.FC<GeographyProps>;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    translateExtent?: [[number, number], [number, number]];
    children?: React.ReactNode;
  }

  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
}
