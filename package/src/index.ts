import BazConvert from "./helper/BazConvert.ts"
import BazGeneral from "./helper/BazGeneral.ts"

import { ShadowRootMode } from "./component/ShadowRootMode.ts"
import BazlamaWebComponent from "./component/BazlamaWebComponent.ts"

import PropertyDefine from "./property/PropertyDefine.ts"
import PropertyBuilder from "./property/PropertyBuilder.ts"
import { TPropertyValueType, TPropertyValueTypeName } from "./property/types/TPropertyValueType.ts"
import TPropertyChangeHook from "./property/types/TPropertyChangeHandler.ts"
import IPropertyDefineOption from "./property/types/IPropertyDefineOption.ts"
import IPropertyEventDetail from "./property/types/IPropertyEventDetail.ts"

import CustomElement from "./decorator/CustomElement.ts"
import Property from "./decorator/Property.ts"
import Attribute from "./decorator/Attribute.ts"
import ChangeHooks from "./decorator/ChangeHooks.ts"
import EventAction from "./decorator/EventAction.ts"
import FireEvent from "./decorator/FireEvent.ts"
import FireRender from "./decorator/FireRender.ts"

import useCustomHook from "./property/hooks/useCustomHook.ts"
import useElementAttribute from "./property/hooks/useElementAttribute.ts"
import useElementInputValue from "./property/hooks/useElementInputValue.ts"
import useElementInputRadioValue from "./property/hooks/useElementInputRadioValue.ts"
import useElementProperty from "./property/hooks/useElementProperty.ts"
import useElementStyle from "./property/hooks/useElementStyle.ts"
import useElementStyleFromFloat from "./property/hooks/useElementStyleFromFloat.ts"
import useElementStyleFromInteger from "./property/hooks/useElementStyleFromInteger.ts"
import useElementText from "./property/hooks/useElementText.ts"
import useElementTextWithFunction from "./property/hooks/useElementTextWithFunction.ts"
import useToggleClass from "./property/hooks/useToggleClass.ts"
import useSwitchClass from "./property/hooks/useSwitchClass.ts"
import useFunction from "./property/hooks/useFunction.ts"

import EventActionMap from "./event-action/EventActionMap.ts"
import { TEventActionDefine } from "./event-action/TEventActionDefine.ts"
import { IEventActionDefines } from "./event-action/types/IEventActionDefines.ts"
import { IEventActionMaps } from "./event-action/types/IEventActionMaps.ts"
import { TEventActionMethod } from "./event-action/TEventActionMethod.ts"
import EventActionBuilder from "./event-action/EventActionBuilder.ts"
import useAddRemoveClass from "./property/hooks/useAddRemoveClass.ts"

export {
    BazConvert,
    BazGeneral,

    ShadowRootMode,
    BazlamaWebComponent,
    
    EventActionMap,
    EventActionBuilder,

    PropertyDefine,
    PropertyBuilder,

    // Decorators
    CustomElement,
    EventAction,
    Property,
    Attribute,
    ChangeHooks,
    FireEvent,
    FireRender,

    // Hooks
    useCustomHook,
    useElementAttribute,
    useElementInputValue,
    useElementInputRadioValue,
    useElementProperty,
    useElementStyle,
    useElementStyleFromFloat,
    useElementStyleFromInteger,
    useElementText,
    useElementTextWithFunction,
    useToggleClass,
    useSwitchClass,
    useAddRemoveClass,
    useFunction,
}

export type {
    TPropertyValueType,
    TPropertyValueTypeName,
    TPropertyChangeHook,
    IPropertyDefineOption,
    IPropertyEventDetail,
    
    TEventActionDefine,
    IEventActionDefines,    
    
    TEventActionMethod,
    IEventActionMaps,
}
