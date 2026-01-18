/*
    Bazlama Web Component Project
    Change Event for Bazlama Web Component Property
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import type BazlamaWebComponent from "../../component/BazlamaWebComponent";
import type PropertyDefine from "../PropertyDefine";
import type { TPropertyValueType } from "./TPropertyValueType";

type TPropertyChangeHook = (
  bazComponent: BazlamaWebComponent,
  value: TPropertyValueType,
  propertyDefine: PropertyDefine,
  oldValue: TPropertyValueType
) => void;

export default TPropertyChangeHook;
