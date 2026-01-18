import type BazlamaWebComponent from "../../component/BazlamaWebComponent";
import type { TPropertyValueType } from "./TPropertyValueType";

export type TPropertyChangeCalculateValue = (
  value: TPropertyValueType,
  query: string,
  property: string,
  bazComponent: BazlamaWebComponent
) => TPropertyValueType;
