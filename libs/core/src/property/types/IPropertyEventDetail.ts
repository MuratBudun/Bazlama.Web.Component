import type BazlamaWebComponent from "../../component/BazlamaWebComponent";
import type { TPropertyValueType } from "./TPropertyValueType";

interface IPropertyEventDetail {
  bazComponent: BazlamaWebComponent;
  name: string;
  value: TPropertyValueType;
  oldValue: TPropertyValueType;
}

export default IPropertyEventDetail;
